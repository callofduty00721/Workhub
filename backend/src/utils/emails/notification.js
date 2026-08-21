import { brandedButtonEmailHtml } from "./shared.js";

// Used for every in-app notification that also emails (payments, KYC review
// outcomes, disputes, withdrawals, hires, milestones, interview invites,
// etc. — see notify.js's EMAIL_EXCLUDED_TYPES for what's deliberately left
// out). `title` doubles as both the email subject and the heading here, so
// callers should keep it short — same value already used as the in-app
// notification's title.
export function notificationEmailHtml(name, title, message, url) {
  return brandedButtonEmailHtml({
    heading: title,
    bodyHtml: `<p style="margin:0 0 14px;color:#536174;font-size:15px;line-height:1.7;">Hi ${name},</p>${
      message ? `<p style="margin:0 0 24px;color:#536174;font-size:15px;line-height:1.7;">${message}</p>` : `<div style="margin-bottom:10px;"></div>`
    }`,
    buttonLabel: "View on GrowHive",
    buttonUrl: url,
    footerNote: "You're getting this because email notifications are on for your account — manage this anytime from Settings.",
  });
}
