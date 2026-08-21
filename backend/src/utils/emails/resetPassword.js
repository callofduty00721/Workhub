import { brandedButtonEmailHtml } from "./shared.js";

export function resetPasswordEmailHtml(name, resetUrl) {
  return brandedButtonEmailHtml({
    heading: "Reset your password",
    bodyHtml: `<p style="margin:0 0 14px;color:#536174;font-size:15px;line-height:1.7;">Hi ${name},</p><p style="margin:0 0 24px;color:#536174;font-size:15px;line-height:1.7;">We received a request to reset your GrowHive password. Click the button below to choose a new one:</p>`,
    buttonLabel: "Reset Password",
    buttonUrl: resetUrl,
    footerNote: "This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't be changed.",
  });
}
