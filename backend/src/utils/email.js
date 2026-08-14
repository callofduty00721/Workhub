import nodemailer from "nodemailer";
import { logger } from "./logger.js";

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
 */
export async function sendEmail({ to, subject, html }) {
  const client = getTransporter();

  if (!client) {
    logger.info(`[email:not-configured] To: ${to} | Subject: ${subject}\n${html}`);
    return { delivered: false };
  }

  await client.sendMail({ from: process.env.EMAIL_FROM || "GrowHive <no-reply@growhive.io>", to, subject, html });
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

export function verificationEmailHtml(name, verifyUrl) {
  return `<p>Hi ${name},</p><p>Welcome to GrowHive! Please verify your email address to activate your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`;
}

// Sign-up verification code — used instead of the link above when
// registering with email, so both channels (email/phone) confirm the same
// way: enter a code before the account is created.
export function otpEmailHtml(name, otp) {
  return `<p>Hi ${name},</p><p>Your GrowHive verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otp}</p><p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>`;
}

export function resetPasswordEmailHtml(name, resetUrl) {
  return `<p>Hi ${name},</p><p>We received a request to reset your GrowHive password. Click the link below to choose a new one:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`;
}

// Sent once, right after an account is actually created (email OTP verified,
// or first-time Google sign-in) — not to be confused with verificationEmailHtml
// above, which is a "confirm your email" link for an unverified account; by
// the time this one goes out the account is already verified, so there's no
// CTA link to click, just a pointer to the role picker.
export function welcomeEmailHtml(name, exploreUrl) {
  return `<p>Hi ${name},</p><p>Welcome to GrowHive! Your account is ready.</p><p>Head over and pick what you're here to do — freelance work, influencer campaigns, hiring, or building a startup:</p><p><a href="${exploreUrl}">Get started</a></p>`;
}
