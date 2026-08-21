import { asyncHandler } from "../../middleware/asyncHandler.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { sendEmail, isEmailConfigured } from "../../utils/email.js";
import { logger } from "../../utils/logger.js";
import Grievance from "./grievance.model.js";

// Public contact form — no auth required. This is also the intake for the
// IT Rules 2021 grievance mechanism referenced in the Privacy Policy/Terms —
// every submission becomes a Grievance record admins can track through
// acknowledged/resolved (see admin/grievances.js), not just a one-off email
// that can get lost in an inbox with no record it was ever sent.
export const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  const grievance = await Grievance.create({ name, email, subject: subject || "", message });

  // Best-effort real-time nudge to the admin inbox — the Grievance row above
  // is the actual system of record, so a missing/misconfigured SMTP setup
  // shouldn't block the submission itself. SUPPORT_EMAIL is the real
  // business inbox (support@<domain>) once one exists; falls back to
  // whatever mailbox is actually authenticating the outgoing SMTP connection
  // if it's never been set.
  const to = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || process.env.SMTP_USER;
  if (isEmailConfigured() && to) {
    try {
      await sendEmail({
        to,
        subject: `[GrowHive Contact] ${subject?.trim() || "New message"} — from ${name.trim()}`,
        html: `<p><strong>From:</strong> ${name.trim()} (${email.trim()})</p><p><strong>Message:</strong></p><p>${message.trim().replace(/\n/g, "<br/>")}</p>`,
      });
    } catch (err) {
      logger.error("Failed to send contact-form notification email", { error: err.message, grievanceId: grievance._id.toString() });
    }
  }

  res.status(201).json({ success: true, message: "Message sent" });
});
