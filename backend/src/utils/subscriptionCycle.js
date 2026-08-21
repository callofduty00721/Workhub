// Single source of truth for how long a subscription lasts per billing
// cycle — previously duplicated (and drifted out of sync: the webhook
// fallback in webhooks.controller.js had a hardcoded 30-day expiry for
// every cycle, silently short-changing yearly subscribers who fell back to
// that path). Both the client-verified path (subscription.controller.js)
// and the server-side webhook fallback (webhooks.controller.js) import this.
const DAY_MS = 24 * 60 * 60 * 1000;

export const CYCLE_DURATION_MS = { monthly: 30 * DAY_MS, yearly: 365 * DAY_MS };
