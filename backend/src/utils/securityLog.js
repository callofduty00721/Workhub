import SecurityEvent from "../modules/shared/securityEvent.model.js";
import { logger } from "./logger.js";

// The audit trail this fills: failed logins, password changes, role
// switches — none of which had any persistent record before (only the rate
// limiter's ephemeral counters), so an account-takeover attempt could never
// be reviewed after the fact. Deliberately never throws or blocks the
// caller — a logging failure must not turn into an authentication outage,
// same reasoning as job.controller.js's own best-effort logAccess.
export async function logSecurityEvent(req, { type, user, email, detail }) {
  try {
    await SecurityEvent.create({
      type,
      user: user || undefined,
      email: email || "",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "",
      detail: detail || "",
    });
  } catch (err) {
    logger.error("Failed to record security event", { type, error: err.message });
  }
}
