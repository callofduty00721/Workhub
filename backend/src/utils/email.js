import nodemailer from "nodemailer";

export const isEmailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

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
    console.log(`[email:not-configured] To: ${to} | Subject: ${subject}\n${html}`);
    return { delivered: false };
  }

  await client.sendMail({ from: process.env.EMAIL_FROM || "MahaHub <no-reply@mahahub.io>", to, subject, html });
  return { delivered: true };
}

export function verificationEmailHtml(name, verifyUrl) {
  return `<p>Hi ${name},</p><p>Welcome to MahaHub! Please verify your email address to activate your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`;
}

export function resetPasswordEmailHtml(name, resetUrl) {
  return `<p>Hi ${name},</p><p>We received a request to reset your MahaHub password. Click the link below to choose a new one:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`;
}
