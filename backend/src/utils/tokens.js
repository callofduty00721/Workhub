import jwt from "jsonwebtoken";

export const signAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });

export const signRefreshToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), version: user.refreshTokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "30d" }
  );

export const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// Short-lived "ticket" holding a not-yet-created signup's details (name,
// email or phone, password, role, referralCode, plus an email OTP hash when
// channel is "email") between /auth/register and /auth/verify-otp — the
// account itself isn't created until the code is confirmed, so there's no
// user row to attach this state to in the meantime. `purpose` is checked on
// verify so this can never be replayed as a real access token even though it
// shares a secret with one.
export const signPendingRegistrationToken = (payload) =>
  jwt.sign({ ...payload, purpose: "pending_registration" }, process.env.JWT_ACCESS_SECRET, { expiresIn: "10m" });

export const verifyPendingRegistrationToken = (token) => {
  const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  if (payload.purpose !== "pending_registration") throw new Error("Invalid token purpose");
  return payload;
};

export const REFRESH_COOKIE_NAME = "mahahub_rt";

// Frontend (Vercel) and backend (Railway) live on different domains in
// production, so the browser treats every API call as cross-site — "lax"
// cookies are withheld from those, only sent on top-level navigation. "none"
// is required for a cross-site cookie to be sent at all, and browsers only
// honor "none" when `secure` is also true (already the case in production).
export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
};
