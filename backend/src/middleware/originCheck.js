import { ApiError } from "./errorHandler.js";

// CSRF defense for the two endpoints that authenticate purely off the
// httpOnly refresh-token cookie (no Authorization header to check): reject
// any request whose Origin/Referer isn't our own frontend.
//
// This is NOT just defense-in-depth on top of SameSite — in production,
// frontend (Vercel) and backend (Railway) are different origins, so the
// cookie is issued with SameSite=None (see utils/tokens.js's
// refreshCookieOptions), which by design is sent on every cross-site
// request. That makes this the *only* CSRF defense for these two routes in
// that configuration, not a backup for it.
//
// A missing Origin/Referer therefore must NOT be treated as "trust it" —
// only a real browser can ever present this httpOnly cookie in the first
// place (it isn't readable/settable by non-browser tooling), and every
// realistic browser request (fetch/XHR always; top-level navigation and
// most form submissions too) carries at least one of these two headers. A
// request with neither is exactly the anomalous case this check exists to
// catch, so it's rejected the same as a mismatched one.
export function requireTrustedOrigin(req, res, next) {
  const allowed = process.env.CLIENT_URL;
  if (!allowed) return next(); // nothing configured to check against (e.g. local dev without CLIENT_URL set)

  const origin = req.headers.origin || req.headers.referer;
  if (!origin || !origin.startsWith(allowed)) {
    return next(new ApiError(403, "Request origin not allowed"));
  }
  next();
}
