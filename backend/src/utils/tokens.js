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

export const REFRESH_COOKIE_NAME = "mahahub_rt";

export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
};
