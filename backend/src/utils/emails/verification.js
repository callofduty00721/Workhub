import { brandedButtonEmailHtml } from "./shared.js";

export function verificationEmailHtml(name, verifyUrl) {
  return brandedButtonEmailHtml({
    heading: "Verify your email",
    bodyHtml: `<p style="margin:0 0 14px;color:#536174;font-size:15px;line-height:1.7;">Hi ${name},</p><p style="margin:0 0 24px;color:#536174;font-size:15px;line-height:1.7;">Welcome to GrowHive! Please verify your email address to activate your account.</p>`,
    buttonLabel: "Verify Email",
    buttonUrl: verifyUrl,
    footerNote: "This link expires in 24 hours.",
  });
}
