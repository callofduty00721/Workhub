import nodemailer from "nodemailer";
import { logger } from "./logger.js";
import { otpEmailHtml } from "./emails/otp.js";

export { verificationEmailHtml } from "./emails/verification.js";
export { otpEmailHtml } from "./emails/otp.js";
export { resetPasswordEmailHtml } from "./emails/resetPassword.js";
export { notificationEmailHtml } from "./emails/notification.js";
export { welcomeEmailHtml } from "./emails/welcome.js";
export { subscriptionInvoiceEmailHtml } from "./emails/subscriptionInvoiceEmail.js";

export const isEmailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const isMsg91Configured = () =>
  Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_EMAIL_DOMAIN && process.env.MSG91_EMAIL_FROM && process.env.MSG91_OTP_TEMPLATE_ID);

let transporter = null;

function getTransporter() {
  if (!isEmailConfigured()) return null;
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

/**
 * Sends an email if SMTP is configured; otherwise logs to the console so local
 * development still surfaces the link/token instead of failing silently.
 * `attachments` is passed straight through to nodemailer's sendMail (e.g.
 * [{ filename, content: Buffer }]) — optional, most callers don't need it.
 */
export async function sendEmail({ to, subject, html, attachments }) {
  const client = getTransporter();

  if (!client) {
    logger.info(`[email:not-configured] To: ${to} | Subject: ${subject}\n${html}`);
    return { delivered: false };
  }

  await client.sendMail({
    from: process.env.EMAIL_FROM || "GrowHive <no-reply@growhive.io>",
    to,
    subject,
    html,
    ...(attachments ? { attachments } : {}),
  });
  return { delivered: true };
}

/**
 * Sends the signup/login OTP through MSG91's transactional email API (better
 * inbox deliverability than Gmail SMTP for a high-volume, time-sensitive
 * code) using the pre-approved "global_otp" template — falls back to the
 * regular SMTP path if MSG91 isn't configured or its API call fails, so a
 * MSG91-side outage never blocks signup.
 */
export async function sendOtpEmail(name, to, otp) {
  if (isMsg91Configured()) {
    try {
      const res = await fetch("https://control.msg91.com/api/v5/email/send", {
        method: "POST",
        headers: { accept: "application/json", authkey: process.env.MSG91_AUTH_KEY, "content-type": "application/json" },
        body: JSON.stringify({
          recipients: [{ to: [{ name, email: to }], variables: { company_name: "GrowHive", otp: String(otp) } }],
          from: { name: "GrowHive", email: process.env.MSG91_EMAIL_FROM },
          domain: process.env.MSG91_EMAIL_DOMAIN,
          template_id: process.env.MSG91_OTP_TEMPLATE_ID,
        }),
      });
      if (!res.ok) throw new Error(`MSG91 responded ${res.status}: ${await res.text()}`);
      return { delivered: true };
    } catch (err) {
      logger.error("MSG91 OTP email failed, falling back to SMTP", { error: err.message, to });
    }
  }

  return sendEmail({ to, subject: "Your GrowHive verification code", html: otpEmailHtml(name, otp) });
}
