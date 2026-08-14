import { incrCounter } from "./store.js";
import { verifyAccessToken } from "./tokens.js";

// Wraps utils/store.js's incrCounter — already Redis-when-REDIS_URL-is-set,
// in-memory otherwise, the same helper OTP-attempt limiting uses — as an
// express-rate-limit Store. Without this, express-rate-limit falls back to
// its own default in-memory MemoryStore regardless of REDIS_URL, so multiple
// instances behind a load balancer each end up with their own separate
// counters (a client could get windowMs * instanceCount worth of attempts
// instead of windowMs worth). `prefix` keeps each limiter's counters in its
// own namespace — express-rate-limit's default keyGenerator is just the
// client IP, so two limiters sharing a bare incrCounter key would collide.
export function createRateLimitStore(windowMs, prefix) {
  const windowSeconds = Math.ceil(windowMs / 1000);
  return {
    async increment(key) {
      const totalHits = await incrCounter(`ratelimit:${prefix}:${key}`, windowSeconds);
      return { totalHits, resetTime: new Date(Date.now() + windowMs) };
    },
    // Neither limiter in this app sets skipFailedRequests/skipSuccessfulRequests
    // (the options that trigger decrement), and resetKey is only used for
    // programmatic manual resets — no-ops are correct for both here.
    async decrement() {},
    async resetKey() {},
  };
}

// Keys a rate limiter by user id when a valid access token is present,
// falling back to the client IP otherwise — confirmed via a real load test
// (scripts/loadTestRateLimit.js) that a plain IP-only key means everyone
// behind one public IP shares a single budget. That's fine for the
// login/OTP limiter (there's no token yet at that point, and IP-based
// brute-force protection is exactly what's wanted there), but wrong for the
// app-wide global limiter — mobile carrier-grade NAT (common in India) or
// an office/campus WiFi can put many unrelated logged-in users behind one
// IP, and they shouldn't be able to exhaust each other's budget. A missing/
// invalid/expired token just falls back to IP, same as an unauthenticated
// request — this never rejects the request itself, only picks a bucket for
// it (an actually-invalid token still gets correctly rejected by `protect`
// on whichever route the request is headed to, regardless of what key its
// rate-limit attempt was counted against).
export function userOrIpKeyGenerator(req) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(header.slice(7));
      if (payload?.sub) return `user:${payload.sub}`;
    } catch {
      // fall through to IP
    }
  }
  return req.ip;
}
