import { brandedEmailShell } from "./shared.js";

// Sign-up verification code — used instead of a link when registering with
// email, so both channels (email/phone) confirm the same way: enter a code
// before the account is created. Only reached as sendOtpEmail's SMTP
// fallback — MSG91 (the primary path) uses its own pre-approved template.
export function otpEmailHtml(name, otp) {
  return brandedEmailShell({
    title: "Your GrowHive verification code",
    heading: "Your verification code",
    innerHtml: `<p style="margin:0 0 24px;color:#536174;font-size:15px;line-height:1.7;">Hi ${name}, here's your GrowHive verification code:</p><div style="margin:0 0 24px;padding:18px;border-radius:9px;background:#f5f8f5;text-align:center;font-size:32px;font-weight:800;letter-spacing:8px;color:#132238;">${otp}</div><p style="margin:0;color:#9aa5b1;font-size:12.5px;line-height:1.6;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>`,
  });
}
