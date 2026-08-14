import { ApiError } from "./errorHandler.js";

// Defense-in-depth for the two endpoints that authenticate purely off the
// httpOnly refresh-token cookie (no Authorization header to check): reject
// any request whose Origin/Referer isn't our own frontend. The cookie is
// already SameSite=Lax + path-scoped to /api/auth, which blocks most
// cross-site submission on its own — this just adds a second, independent
// check rather than relying on browser cookie behavior alone.
export function requireTrustedOrigin(req, res, next) {
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return next(); // non-browser clients (curl, mobile) send neither

  const allowed = process.env.CLIENT_URL;
  if (allowed && !origin.startsWith(allowed)) {
    return next(new ApiError(403, "Request origin not allowed"));
  }
  next();
}
