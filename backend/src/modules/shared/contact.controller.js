import { asyncHandler } from "../../middleware/asyncHandler.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { sendEmail } from "../../utils/email.js";

// Public contact form — no auth required. Delivers straight to the same
// inbox transactional emails send from (EMAIL_FROM/SMTP_USER), so a message
// sent here is a real email, not a fabricated "we'll get back to you" stub.
export const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    throw new ApiError(400, "Name, email, and message are required");
  }

  const to = process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || process.env.SMTP_USER;
  if (!to) throw new ApiError(503, "Contact form isn't accepting messages right now — email isn't configured");

  await sendEmail({
    to,
    subject: `[MahaHub Contact] ${subject?.trim() || "New message"} — from ${name.trim()}`,
    html: `<p><strong>From:</strong> ${name.trim()} (${email.trim()})</p><p><strong>Message:</strong></p><p>${message.trim().replace(/\n/g, "<br/>")}</p>`,
  });

  res.status(201).json({ success: true, message: "Message sent" });
});
