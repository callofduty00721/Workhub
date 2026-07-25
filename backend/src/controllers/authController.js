import crypto from "crypto";
import { z } from "zod";
import User, { ROLE_VALUES } from "../models/User.js";

// super_admin is deliberately excluded — it must never be assignable through
// public self-registration, only granted manually (e.g. via a DB update).
const PUBLIC_ROLE_VALUES = ROLE_VALUES.filter((r) => r !== "super_admin");
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from "../utils/tokens.js";
import { sendEmail, verificationEmailHtml, resetPasswordEmailHtml } from "../utils/email.js";
import { verifyGoogleIdToken, isGoogleAuthConfigured } from "../utils/googleAuth.js";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  role: z.enum(PUBLIC_ROLE_VALUES).optional(),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

const issueSession = (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
  return accessToken;
};

async function sendVerificationEmail(user) {
  const token = user.createEmailVerificationToken();
  await user.save();
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  await sendEmail({ to: user.email, subject: "Verify your MahaHub email", html: verificationEmailHtml(user.name, verifyUrl) });
}

export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Validation failed", parsed.error.flatten().fieldErrors);

  const { name, email, password, phone, role, referralCode } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  let referredBy = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
    if (referrer) referredBy = referrer._id;
  }

  const user = await User.create({ name, email, password, phone, role: role || "freelancer", referredBy });
  await sendVerificationEmail(user);

  const accessToken = issueSession(res, user);
  res.status(201).json({ success: true, user: user.toSafeJSON(), accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Validation failed", parsed.error.flatten().fieldErrors);

  const { email, password } = parsed.data;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (user.isBanned) throw new ApiError(403, "This account has been suspended");
  if (user.isDeactivated) throw new ApiError(403, "This account has been deactivated. Contact support to reactivate it.");

  const accessToken = issueSession(res, user);
  res.json({ success: true, user: user.toSafeJSON(), accessToken });
});

export const googleLogin = asyncHandler(async (req, res) => {
  if (!isGoogleAuthConfigured()) {
    throw new ApiError(503, "Google sign-in is not configured on this server. Set GOOGLE_CLIENT_ID.");
  }

  const { idToken } = req.body;
  if (!idToken) throw new ApiError(400, "idToken is required");

  let payload;
  try {
    payload = await verifyGoogleIdToken(idToken);
  } catch {
    throw new ApiError(401, "Invalid Google token");
  }

  let user = await User.findOne({ email: payload.email }).select("+googleId");
  if (!user) {
    user = await User.create({
      name: payload.name,
      email: payload.email,
      googleId: payload.sub,
      avatar: payload.picture,
      isEmailVerified: true,
      role: "freelancer",
    });
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    if (!user.isEmailVerified) user.isEmailVerified = true;
    await user.save();
  }

  if (user.isBanned) throw new ApiError(403, "This account has been suspended");
  if (user.isDeactivated) throw new ApiError(403, "This account has been deactivated. Contact support to reactivate it.");

  const accessToken = issueSession(res, user);
  res.json({ success: true, user: user.toSafeJSON(), accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw new ApiError(401, "No refresh token provided");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, "Refresh token invalid or expired");
  }

  const user = await User.findById(payload.sub);
  if (!user || user.refreshTokenVersion !== payload.version) {
    throw new ApiError(401, "Refresh token no longer valid");
  }

  const accessToken = issueSession(res, user);
  res.json({ success: true, user: user.toSafeJSON(), accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.updateOne({ _id: payload.sub }, { $inc: { refreshTokenVersion: 1 } });
    } catch {
      // token already invalid/expired — nothing to revoke
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  res.json({ success: true, message: "Logged out successfully" });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  if (req.user.isEmailVerified) throw new ApiError(400, "Email is already verified");
  await sendVerificationEmail(req.user);
  res.json({ success: true, message: "Verification email sent" });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationTokenHash +emailVerificationExpires");

  if (!user) throw new ApiError(400, "This verification link is invalid or has expired");

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({ success: true, message: "Email verified successfully" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Response is intentionally generic to avoid leaking whether an email is registered.
  if (user) {
    const token = user.createResetPasswordToken();
    await user.save();
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    await sendEmail({ to: user.email, subject: "Reset your MahaHub password", html: resetPasswordEmailHtml(user.name, resetUrl) });
  }

  res.json({ success: true, message: "If an account exists for this email, a reset link has been sent." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

  const tokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordTokenHash +resetPasswordExpires");

  if (!user) throw new ApiError(400, "This reset link is invalid or has expired");

  user.password = password;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  user.refreshTokenVersion += 1;
  await user.save();

  res.json({ success: true, message: "Password reset successfully. Please log in with your new password." });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword) throw new ApiError(400, "Enter your current password");
  if (!newPassword || newPassword.length < 8) throw new ApiError(400, "New password must be at least 8 characters");

  const user = await User.findById(req.user._id).select("+password");
  if (!user.password) {
    throw new ApiError(400, "This account signed up with Google and has no password to change — use 'Forgot password' to set one.");
  }
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  user.refreshTokenVersion += 1;
  await user.save();

  // The current session's refresh token is now stale too (version bumped),
  // so re-issue one right away rather than forcing an immediate re-login.
  const accessToken = issueSession(res, user);
  res.json({ success: true, message: "Password changed successfully.", accessToken });
});

export const deactivateAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (user.password) {
    if (!password) throw new ApiError(400, "Enter your password to confirm");
    if (!(await user.comparePassword(password))) throw new ApiError(401, "Incorrect password");
  }

  user.isDeactivated = true;
  user.refreshTokenVersion += 1;
  await user.save();

  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  res.json({ success: true, message: "Your account has been deactivated." });
});
