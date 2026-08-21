import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User, { ROLE_VALUES } from "./user.model.js";
import { categoryForRole } from "../../utils/roleCategories.js";

// super_admin and staff are deliberately excluded — neither is ever
// assignable through public self-registration. super_admin is granted
// manually (e.g. a DB update); staff accounts are created by a super_admin
// via /admin/staff (see admin/staff.js).
const PUBLIC_ROLE_VALUES = ROLE_VALUES.filter((r) => r !== "super_admin" && r !== "staff");

// A role picked at signup (or via Google) starts as that user's one and only
// role, in its category — the multi-role add/switch flow (roleController)
// takes over from there for anyone who wants more than one.
function initialRoleFields(role) {
  if (!role) {
    return { role: null, roles: [], selectedCategory: null };
  }
  return {
    role,
    roles: [role],
    selectedCategory: categoryForRole(role),
    ...(role === "job_seeker" ? { jobSeekerProfile: {} } : {}),
    ...(role === "influencer" ? { influencerProfile: {} } : {}),
  };
}
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signPendingRegistrationToken,
  verifyPendingRegistrationToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from "../../utils/tokens.js";
import { sendEmail, verificationEmailHtml, resetPasswordEmailHtml, sendOtpEmail, welcomeEmailHtml } from "../../utils/email.js";
import { verifyGoogleIdToken, isGoogleAuthConfigured } from "../../utils/googleAuth.js";
import { notify } from "../../utils/notify.js";
import { isEmailDomainAllowlisted, getDisabledRoles } from "../finance/platformSettings.model.js";
import { incrCounter } from "../../utils/store.js";
import { isDisposableEmail } from "../../utils/disposableEmail.js";
import { logSecurityEvent } from "../../utils/securityLog.js";

const PHONE_RE = /^\d{10}$/;

// Sign-up accepts either an email or a phone number — never both required,
// but at least one. Phone sign-up additionally needs a real phone OTP
// provider configured (see the "phone" branch of register() below); until
// then it fails with a clear 503 rather than silently creating an
// unverified account.
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address").optional(),
    phone: z.string().regex(PHONE_RE, "Enter a valid 10-digit phone number").optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(PUBLIC_ROLE_VALUES).optional(),
    referralCode: z.string().optional(),
  })
  .refine((d) => d.email || d.phone, { message: "Provide an email or phone number", path: ["email"] });

const loginSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().regex(PHONE_RE).optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((d) => d.email || d.phone, { message: "Provide an email or phone number", path: ["email"] });

const verifyOtpSchema = z.object({
  ticket: z.string().min(1, "Missing verification session"),
  otp: z.string().min(4, "Enter the code you received"),
});

const resendOtpSchema = z.object({
  ticket: z.string().min(1, "Missing verification session"),
});

const generateOtp = () => String(crypto.randomInt(100000, 999999));
const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

// A 6-digit OTP has 1M combinations — the shared authRateLimit middleware
// (middleware/authRateLimit.js) alone still leaves an attacker most of the
// ticket's 10-minute window to brute-force it (its own per-ticket account
// counter is far looser, sized for legitimate retries, not for this). This
// caps attempts *per ticket* specifically, on top of that. Keyed by a hash
// of the ticket (not the ticket itself, so nothing sensitive sits in the
// counter store) with the same TTL as the ticket's own expiry, so the
// counter never outlives what it's guarding.
const MAX_OTP_ATTEMPTS = 5;
const TICKET_TTL_SECONDS = 10 * 60;
const otpAttemptKey = (ticket) => `otp_attempts:${crypto.createHash("sha256").update(ticket).digest("hex")}`;

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
  await sendEmail({ to: user.email, subject: "Verify your GrowHive email", html: verificationEmailHtml(user.name, verifyUrl) });
}

// Fire-and-forget, deliberately not awaited by callers — the account/session
// is already fully created by the time this runs, so a flaky SMTP send here
// must never turn into a failed signup response. Only fires for an email
// address (Google sign-in always has one; phone sign-up currently can't
// reach here at all, see register()'s phone branch).
function sendWelcomeEmail(user) {
  if (!user.email) return;
  const exploreUrl = `${process.env.CLIENT_URL}/dashboard/explore`;
  sendEmail({ to: user.email, subject: "Welcome to GrowHive!", html: welcomeEmailHtml(user.name, exploreUrl) }).catch(() => {});
}

// Shared by both the email-OTP and phone-OTP verify paths — creates the
// account only once a code has actually been confirmed, re-checking for a
// duplicate email/phone in case one was registered elsewhere during the
// (max 10 minute) window the ticket was outstanding.
//
// `payload.passwordHash` is already a bcrypt hash (see register()/
// resendRegisterOtp() below) — the ticket that travels to/from the browser
// between here and /auth/register never carries a recoverable plaintext
// password, only this one-way hash, so decoding the JWT client-side (its
// payload is base64, not encrypted) exposes nothing usable. `$locals` tells
// the model's pre-save hook not to hash it again.
async function createVerifiedUser(payload) {
  // Re-checked here, not just at register() — the ticket can sit unused for
  // minutes while the OTP is entered, long enough for an admin to flip
  // disabledRoles in between.
  if (payload.role && (await getDisabledRoles()).includes(payload.role)) {
    throw new ApiError(400, `Signups for "${payload.role}" are temporarily disabled. Please choose a different role.`);
  }

  let referredBy = null;
  if (payload.referralCode) {
    const referrer = await User.findOne({ referralCode: payload.referralCode.trim().toUpperCase() });
    if (referrer) referredBy = referrer._id;
  }

  const base = { name: payload.name, password: payload.passwordHash, referredBy, ...initialRoleFields(payload.role) };

  if (payload.channel === "email") {
    if (await User.findOne({ email: payload.email })) throw new ApiError(409, "An account with this email already exists");
    const user = new User({ ...base, email: payload.email, isEmailVerified: true });
    user.$locals.skipPasswordHash = true;
    return user.save();
  }

  if (await User.findOne({ phone: payload.phone })) throw new ApiError(409, "An account with this phone number already exists");
  const user = new User({ ...base, phone: payload.phone, isPhoneVerified: true });
  user.$locals.skipPasswordHash = true;
  return user.save();
}

export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Validation failed", parsed.error.flatten().fieldErrors);

  const { name, email, password, role, referralCode } = parsed.data;

  if (role && (await getDisabledRoles()).includes(role)) {
    throw new ApiError(400, `Signups for "${role}" are temporarily disabled. Please choose a different role.`);
  }

  // Facebook-style for both channels: no account exists yet and no session
  // is issued until the code is confirmed via /auth/verify-otp. The pending
  // signup details travel in a signed, short-lived ticket rather than a DB
  // row, since there's no user to attach them to yet.
  if (email) {
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (isDisposableEmail(email) && !(await isEmailDomainAllowlisted(emailDomain))) {
      throw new ApiError(400, "Please use a real, permanent email address — temporary or disposable email addresses aren't allowed.");
    }

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, "An account with this email already exists");

    const otp = generateOtp();
    // Hashed here, immediately — the raw password never gets embedded in the
    // ticket that round-trips through the browser (see createVerifiedUser).
    const passwordHash = await bcrypt.hash(password, 12);
    const ticket = signPendingRegistrationToken({
      channel: "email",
      name,
      email,
      passwordHash,
      role: role ?? null,
      referralCode: referralCode ?? null,
      otpHash: hashOtp(otp),
    });
    await sendOtpEmail(name, email, otp);
    return res.status(200).json({ success: true, requiresOtpVerification: true, channel: "email", destination: email, ticket });
  }

  // Phone sign-up needs a real, working OTP provider — none is currently
  // wired into this flow (Twilio was removed; Firebase is only implemented
  // for re-verifying an existing account's phone from the edit-profile page,
  // see user.controller.js's verifyPhoneFirebaseToken, not for sign-up).
  // Fails with a clear 503 instead of silently creating an unverified account.
  throw new ApiError(503, "Phone sign-up isn't available right now — please use your email instead.");
});

export const verifyRegisterOtp = asyncHandler(async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Validation failed", parsed.error.flatten().fieldErrors);

  const { ticket, otp } = parsed.data;
  let payload;
  try {
    payload = verifyPendingRegistrationToken(ticket);
  } catch {
    throw new ApiError(400, "This verification session has expired — please sign up again");
  }

  const attempts = await incrCounter(otpAttemptKey(ticket), TICKET_TTL_SECONDS);
  if (attempts > MAX_OTP_ATTEMPTS) {
    throw new ApiError(429, "Too many incorrect attempts — please sign up again to get a new code.");
  }

  if (payload.channel === "email") {
    if (hashOtp(otp) !== payload.otpHash) throw new ApiError(400, "Incorrect or expired code");
  } else if (payload.channel === "phone") {
    // register() no longer issues a "phone" ticket (phone sign-up has no
    // working provider) — this only guards a stale ticket from before that
    // change was deployed.
    throw new ApiError(503, "Phone sign-up isn't available right now");
  } else {
    throw new ApiError(400, "Invalid verification session");
  }

  const user = await createVerifiedUser(payload);
  sendWelcomeEmail(user);
  logSecurityEvent(req, { type: "register_success", user: user._id, email: user.email });
  const accessToken = issueSession(res, user);
  res.status(201).json({ success: true, user: user.toSafeJSON(), accessToken });
});

export const resendRegisterOtp = asyncHandler(async (req, res) => {
  const parsed = resendOtpSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Validation failed", parsed.error.flatten().fieldErrors);

  let payload;
  try {
    payload = verifyPendingRegistrationToken(parsed.data.ticket);
  } catch {
    throw new ApiError(400, "This verification session has expired — please sign up again");
  }

  if (payload.channel === "email") {
    const otp = generateOtp();
    // Strip the JWT's own reserved claims before re-signing a fresh ticket
    // with the new OTP hash, or jwt.sign rejects the duplicate exp/iat/purpose.
    const { iat, exp, purpose, otpHash, ...rest } = payload;
    const newTicket = signPendingRegistrationToken({ ...rest, otpHash: hashOtp(otp) });
    await sendOtpEmail(payload.name, payload.email, otp);
    return res.json({ success: true, message: "We sent a new code to your email.", ticket: newTicket });
  }

  if (payload.channel === "phone") {
    // Same stale-ticket guard as verifyRegisterOtp above.
    throw new ApiError(503, "Phone sign-up isn't available right now");
  }

  throw new ApiError(400, "Invalid verification session");
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Validation failed", parsed.error.flatten().fieldErrors);

  const { email, phone, password } = parsed.data;
  const user = await User.findOne(email ? { email } : { phone }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    logSecurityEvent(req, { type: "login_failed", email: email || phone, detail: user ? "wrong password" : "no such account" });
    throw new ApiError(401, "Invalid credentials");
  }
  if (user.isBanned) throw new ApiError(403, "This account has been suspended");
  if (user.isDeactivated) throw new ApiError(403, "This account has been deactivated. Contact support to reactivate it.");

  logSecurityEvent(req, { type: "login_success", user: user._id, email: user.email });
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
    logSecurityEvent(req, { type: "google_login_failed", detail: "token verification failed" });
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
      ...initialRoleFields(null),
    });
    sendWelcomeEmail(user);
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    if (!user.isEmailVerified) user.isEmailVerified = true;
    await user.save();
  }

  if (user.isBanned) throw new ApiError(403, "This account has been suspended");
  if (user.isDeactivated) throw new ApiError(403, "This account has been deactivated. Contact support to reactivate it.");

  logSecurityEvent(req, { type: "google_login_success", user: user._id, email: user.email });
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
  // The event is still logged either way (server-side only, never reflected
  // in the response) — that's what makes a burst of forgot-password
  // requests probing many addresses reviewable after the fact.
  if (user) {
    const token = user.createResetPasswordToken();
    await user.save();
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    await sendEmail({ to: user.email, subject: "Reset your GrowHive password", html: resetPasswordEmailHtml(user.name, resetUrl) });
    logSecurityEvent(req, { type: "password_reset_requested", user: user._id, email: user.email });
  } else {
    logSecurityEvent(req, { type: "password_reset_requested", email, detail: "no such account" });
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
  logSecurityEvent(req, { type: "password_reset_completed", user: user._id, email: user.email });

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
    logSecurityEvent(req, { type: "login_failed", user: user._id, email: user.email, detail: "wrong current password on change-password" });
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  user.refreshTokenVersion += 1;
  await user.save();
  logSecurityEvent(req, { type: "password_changed", user: user._id, email: user.email });

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
  logSecurityEvent(req, { type: "account_deactivated", user: user._id, email: user.email });

  // Self-service deactivation is otherwise silent to the platform — surface
  // it to admins so it shows up as a real event, not just a flag in a table
  // nobody's looking at.
  const admins = await User.find({ role: "super_admin" }).select("_id");
  await Promise.all(
    admins.map((admin) =>
      notify(req.app, {
        user: admin._id,
        type: "system",
        title: "A user deactivated their account",
        message: `${user.name} (${user.email}) deactivated their account.`,
        link: "/dashboard/admin/users",
      })
    )
  );

  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  res.json({ success: true, message: "Your account has been deactivated." });
});
