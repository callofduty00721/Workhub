import crypto from "crypto";
import { cacheGet, cacheSet } from "../utils/store.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { RATE_LIMITS } from "../config/rateLimits.js";

// Whatever identifies "the account" being attempted, independent of the
// caller's IP — so a targeted attack on one specific user (spread across
// many IPs, e.g. a botnet) still gets throttled even though no single IP
// crosses the per-IP threshold. Covers every shape auth routes see it in:
// email/phone at register & login, an OTP ticket at verify/resend-otp, a
// reset token at reset-password, or (for the already-protected
// change-password/deactivate routes, which run this limiter before `protect`
// has attached req.user) the user id straight off the bearer token.
function accountKeyFromRequest(req) {
  const body = req.body || {};
  if (body.email) return `email:${String(body.email).toLowerCase().trim()}`;
  if (body.phone) return `phone:${String(body.phone).trim()}`;
  // Hashed, not raw — same reasoning as auth.controller.js's own
  // otp_attempts key: a ticket/token is a bearer secret, so it shouldn't sit
  // in plain text in the counter store.
  if (body.ticket) return `ticket:${crypto.createHash("sha256").update(String(body.ticket)).digest("hex")}`;
  if (req.params?.token) return `token:${crypto.createHash("sha256").update(String(req.params.token)).digest("hex")}`;

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(header.slice(7));
      if (payload?.sub) return `user:${payload.sub}`;
    } catch {
      // no verifiable identity from the token either — IP-only protection applies
    }
  }
  return null;
}

// Exponential backoff instead of a hard lockout: the first `freeAttempts`
// requests in the window are unrestricted, every one after that doubles the
// required wait (capped at backoffMaxMs) instead of flatly blocking for the
// rest of a fixed window. A genuine user who mistypes their password twice
// waits a couple seconds, not fifteen minutes; a sustained attack gets
// throttled harder the longer it keeps going. State is a simple get-then-set
// (not atomic under true concurrency) — acceptable here since this is
// defense-in-depth against brute force, not a hard security boundary, and
// matches this codebase's existing risk tolerance for rate-limit counters.
async function checkAndRecord(key, { windowMs, freeAttempts, backoffBaseMs, backoffMaxMs }) {
  const state = (await cacheGet(key)) ?? { count: 0, blockedUntil: 0 };
  const now = Date.now();

  if (state.blockedUntil > now) {
    return { allowed: false, retryAfterMs: state.blockedUntil - now };
  }

  const count = state.count + 1;
  const overBy = count - freeAttempts;
  const blockedUntil = overBy > 0 ? now + Math.min(backoffBaseMs * 2 ** (overBy - 1), backoffMaxMs) : 0;

  await cacheSet(key, { count, blockedUntil }, Math.ceil(windowMs / 1000));
  return blockedUntil > now ? { allowed: false, retryAfterMs: blockedUntil - now } : { allowed: true };
}

// Combines a per-IP counter (catches distributed/scripted attacks from one
// source) with a per-account counter (catches a targeted attack on one user
// spread across many IPs) — either one tripping blocks the request. Applied
// to register/login/OTP/password-reset/change-password/deactivate; see
// auth.routes.js.
export function authRateLimit(req, res, next) {
  const { windowMs, ipFreeAttempts, accountFreeAttempts, backoffBaseMs, backoffMaxMs } = RATE_LIMITS.auth;
  const ipKey = `ratelimit:auth-ip:${req.ip}`;
  const accountIdentifier = accountKeyFromRequest(req);
  const accountKey = accountIdentifier ? `ratelimit:auth-account:${accountIdentifier}` : null;

  Promise.all([
    checkAndRecord(ipKey, { windowMs, freeAttempts: ipFreeAttempts, backoffBaseMs, backoffMaxMs }),
    accountKey
      ? checkAndRecord(accountKey, { windowMs, freeAttempts: accountFreeAttempts, backoffBaseMs, backoffMaxMs })
      : Promise.resolve({ allowed: true, retryAfterMs: 0 }),
  ])
    .then(([ipResult, accountResult]) => {
      const blocked = [ipResult, accountResult].find((r) => !r.allowed);
      if (blocked) {
        const retryAfterSeconds = Math.ceil(blocked.retryAfterMs / 1000);
        res.set("Retry-After", String(retryAfterSeconds));
        return res.status(429).json({
          success: false,
          message: "Too many attempts. Please wait before trying again.",
          retryAfterSeconds,
        });
      }
      next();
    })
    .catch(next);
}
