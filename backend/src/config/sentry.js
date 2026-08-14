import * as Sentry from "@sentry/node";
import { logger } from "../utils/logger.js";

// Off unless SENTRY_DSN is set — same "disabled until configured" pattern as
// the other optional integrations in this codebase (Cloudinary, Firebase, etc).
export const sentryEnabled = Boolean(process.env.SENTRY_DSN);

export function initSentry() {
  if (!sentryEnabled) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
  });
  logger.info("Sentry error tracking enabled");
}

export function captureException(err) {
  if (sentryEnabled) Sentry.captureException(err);
}
