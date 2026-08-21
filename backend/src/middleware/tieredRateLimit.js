import rateLimit from "express-rate-limit";
import { createRateLimitStore, userOrIpKeyGenerator, resolveRequestAuthPayload } from "../utils/rateLimitStore.js";
import { RATE_LIMITS } from "../config/rateLimits.js";

// Two named limiters (moderate for anonymous/public traffic, looser for a
// logged-in user's own actions) instead of one flat app-wide number —
// separate Redis/memory namespaces via createRateLimitStore's `prefix`, same
// per-user-or-IP key either way (see userOrIpKeyGenerator).
const publicLimiter = rateLimit({
  windowMs: RATE_LIMITS.public.windowMs,
  limit: RATE_LIMITS.public.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  message: { success: false, message: "Too many requests — please slow down and try again shortly." },
  store: createRateLimitStore(RATE_LIMITS.public.windowMs, "public"),
});

const authenticatedLimiter = rateLimit({
  windowMs: RATE_LIMITS.authenticated.windowMs,
  limit: RATE_LIMITS.authenticated.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  message: { success: false, message: "Too many requests — please slow down and try again shortly." },
  store: createRateLimitStore(RATE_LIMITS.authenticated.windowMs, "authenticated"),
});

// App-wide catch-all: picks the moderate tier for anonymous requests and the
// looser tier for requests carrying a valid access token, replacing a single
// flat limit that couldn't tell a logged-in user's normal usage apart from
// anonymous browsing. Dedicated limiters (auth routes, payment routes) stack
// on top of this rather than replacing it — defense in depth, same pattern
// payment.routes.js already used against the old flat global limiter.
export function tieredRateLimit(req, res, next) {
  const authenticated = !!resolveRequestAuthPayload(req)?.sub;
  return authenticated ? authenticatedLimiter(req, res, next) : publicLimiter(req, res, next);
}
