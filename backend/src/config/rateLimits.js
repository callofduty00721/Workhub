// Central, env-configurable thresholds for every rate limiter in the app —
// nothing here is hardcoded in the limiters themselves, so tuning a limit for
// a specific deployment (or under active attack) is a config change, not a
// code change. Falls back to sensible defaults when a var is unset/blank/
// invalid, same "degrade to a sane default" pattern as the rest of src/config.
function envInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const RATE_LIMITS = {
  // Auth routes (login, register, OTP, password reset/change, deactivate):
  // per-IP and per-account counters are tracked separately (see
  // middleware/authRateLimit.js) and either one tripping blocks the request.
  // The first `ipFreeAttempts`/`accountFreeAttempts` requests in a window are
  // unrestricted; every one after that doubles the required wait instead of
  // flatly locking out for the rest of the window.
  auth: {
    windowMs: envInt("RATE_LIMIT_AUTH_WINDOW_MS", 15 * 60 * 1000),
    ipFreeAttempts: envInt("RATE_LIMIT_AUTH_IP_FREE_ATTEMPTS", 30),
    accountFreeAttempts: envInt("RATE_LIMIT_AUTH_ACCOUNT_FREE_ATTEMPTS", 6),
    backoffBaseMs: envInt("RATE_LIMIT_AUTH_BACKOFF_BASE_MS", 2 * 1000),
    backoffMaxMs: envInt("RATE_LIMIT_AUTH_BACKOFF_MAX_MS", 15 * 60 * 1000),
  },
  // Every other route, split by whether the request carries a valid access
  // token — anonymous/public browsing gets the moderate tier, a logged-in
  // user's own actions get the looser one. See middleware/tieredRateLimit.js.
  public: {
    windowMs: envInt("RATE_LIMIT_PUBLIC_WINDOW_MS", 15 * 60 * 1000),
    max: envInt("RATE_LIMIT_PUBLIC_MAX", 300),
  },
  authenticated: {
    windowMs: envInt("RATE_LIMIT_AUTHENTICATED_WINDOW_MS", 15 * 60 * 1000),
    max: envInt("RATE_LIMIT_AUTHENTICATED_MAX", 900),
  },
  // Unchanged, moved here only so every threshold lives in one place.
  payment: {
    windowMs: envInt("RATE_LIMIT_PAYMENT_WINDOW_MS", 15 * 60 * 1000),
    max: envInt("RATE_LIMIT_PAYMENT_MAX", 30),
  },
};
