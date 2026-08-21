// Shared branded shell for the one-CTA-button transactional emails
// (verification/reset/notification) — a plain "click this raw link" email is
// both unpolished and one of the more common spam-filter/phishing red flags,
// so every link-driven email renders the link as a real button, with the raw
// URL kept underneath as plain-text fallback for clients that strip styling.
//
// Logo mark is the same growhive/email-assets/logo-mark asset used in
// welcome.js, rasterized (email clients don't render SVG reliably) and
// trimmed of its transparent padding via Cloudinary's transformation
// pipeline.
const LOGO_MARK_URL =
  "https://res.cloudinary.com/bpcqn6kw/image/upload/e_trim/c_fit,h_80,w_80/v1787253084/growhive/email-assets/logo-mark.png";

// Base shell shared by every branded transactional email — header logo,
// white card, footer. Callers supply the heading + everything between it and
// the footer (`innerHtml`); brandedButtonEmailHtml and otpEmailHtml both
// build on this instead of duplicating the outer chrome.
export function brandedEmailShell({ title, heading, innerHtml }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f8f5;color:#132238;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f8f5;padding:30px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background-color:#ffffff;border-radius:14px;overflow:hidden;border-top:4px solid #20b526;">
            <tr>
              <td align="center" style="padding:25px 30px;border-bottom:1px solid #edf1ed;">
                <div style="font-size:28px;font-weight:800;letter-spacing:-1px;color:#132238;"><img src="${LOGO_MARK_URL}" width="28" height="28" alt="" style="display:inline-block;width:28px;height:28px;vertical-align:-7px;margin-right:6px;" />Grow<span style="color:#20b526;">Hive</span></div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 35px;">
                <h1 style="margin:0 0 16px;font-size:21px;color:#132238;">${heading}</h1>
                ${innerHtml}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 20px;border-top:1px solid #e8ece8;color:#7a8593;font-size:12px;">
                &#169; ${new Date().getFullYear()} GrowHive. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function brandedButtonEmailHtml({ heading, bodyHtml, buttonLabel, buttonUrl, footerNote }) {
  return brandedEmailShell({
    title: heading,
    heading,
    innerHtml: `${bodyHtml}<a href="${buttonUrl}" style="display:inline-block;margin-top:6px;padding:14px 28px;border-radius:9px;background:#20b526;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">${buttonLabel}</a><p style="margin:26px 0 0;color:#9aa5b1;font-size:12.5px;line-height:1.6;">${footerNote}</p><p style="margin:14px 0 0;color:#b8c0c9;font-size:11px;line-height:1.6;word-break:break-all;">Or paste this link into your browser: ${buttonUrl}</p>`,
  });
}
