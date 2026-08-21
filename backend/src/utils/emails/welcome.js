// Sent once, right after an account is actually created (email OTP verified,
// or first-time Google sign-in) — not to be confused with verificationEmailHtml,
// which is a "confirm your email" link for an unverified account; by the
// time this one goes out the account is already verified, so there's no CTA
// link to click, just a pointer to the role picker.
//
// Icon-font libraries (FontAwesome etc.), inline SVG, and CSS flexbox/@import
// fonts don't render reliably across real inboxes — Gmail strips <link>
// stylesheets and inline <svg> entirely, and Outlook desktop ignores flexbox
// and most @font-face/@import rules. Every layout is a <table>, not
// flex/grid. The welcome/feature/social icons all started as SVGs, so
// they're rasterized to PNG via Cloudinary's transformation pipeline and
// delivered from growhive/email-assets instead of embedded directly.
const ICON_BASE = "https://res.cloudinary.com/bpcqn6kw/image/upload/c_fit,h_88,w_88";
const ICONS = {
  logoMark: "https://res.cloudinary.com/bpcqn6kw/image/upload/e_trim/c_fit,h_80,w_80/v1787253084/growhive/email-assets/logo-mark.png",
  userGroup: `${ICON_BASE}/v1787246392/growhive/email-assets/user-group-solid-full.png`,
  handshake: `${ICON_BASE}/v1787246394/growhive/email-assets/handshake-solid-full.png`,
  graduationCap: `${ICON_BASE}/v1787246395/growhive/email-assets/graduation-cap-solid-full.png`,
  shieldHalved: `${ICON_BASE}/v1787246397/growhive/email-assets/shield-halved-solid-full.png`,
  heart: `${ICON_BASE}/v1787246398/growhive/email-assets/heart-solid-full.png`,
};

const SOCIAL_BADGES = [
  { icon: "facebook-f-brands-solid-full", v: "1787253815", bg: "#3b5998" },
  { icon: "twitter-brands-solid-full", v: "1787253817", bg: "#111111" },
  { icon: "linkedin-in-brands-solid-full", v: "1787253819", bg: "#0077b5" },
  { icon: "instagram-brands-solid-full", v: "1787253820", bg: "#cc2366" },
  { icon: "youtube-brands-solid-full", v: "1787253822", bg: "#ff0000" },
];

export function welcomeEmailHtml(name, exploreUrl) {
  const backgroundImageUrl =
    "https://res.cloudinary.com/bpcqn6kw/image/upload/v1787202432/background_leaf_inzkpn.png";
  const heroImageUrl =
    "https://res.cloudinary.com/bpcqn6kw/image/upload/v1787202441/ChatGPT_Image_Aug_19_2026_10_53_05_PM_ozxie7.png";
  const socialBadgesHtml = SOCIAL_BADGES.map(
    (b) =>
      `<td style="padding:0 4px;"><span style="display:inline-block;width:30px;height:30px;line-height:30px;border-radius:50%;background:${b.bg};text-align:center;"><img src="${ICON_BASE}/v${b.v}/growhive/email-assets/${b.icon}.png" width="14" height="14" alt="" style="display:block;width:14px;height:14px;margin:8px auto 0;" /></span></td>`,
  ).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to GrowHive</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f8f3;color:#333333;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f8f3;padding:20px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;background-color:#ffffff;background-image:url('${backgroundImageUrl}');background-position:center top;background-size:100% 100%;background-repeat:no-repeat;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.05);">
            <tr>
              <td align="center" style="padding:20px;border-bottom:1px solid #eeeeee;">
                <span style="font-size:28px;font-weight:700;color:#111111;"><img src="${ICONS.logoMark}" width="28" height="28" alt="" style="display:inline-block;width:28px;height:28px;vertical-align:-7px;margin-right:6px;" />GrowHive</span>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="48%" valign="middle" style="padding-right:20px;">
                      <h2 style="margin:0 0 10px;font-size:30px;line-height:1.15;color:#111111;">Welcome to <span style="color:#128c2e;">GrowHive!</span> &#127881;</h2>
                      <h3 style="margin:0 0 15px;font-size:17px;font-weight:600;color:#333333;">Hi <span style="color:#128c2e;">${name}</span>,</h3>
                      <p style="margin:0 0 16px;color:#555555;font-size:14px;line-height:1.6;">We're excited to have you on board! Your account has been successfully created and you're now part of India's growing talent ecosystem.</p>
                      <p style="margin:0 0 20px;color:#555555;font-size:14px;line-height:1.6;">Explore amazing opportunities, connect with professionals, and grow your journey with us.</p>
                      <a href="${exploreUrl}" style="display:inline-block;background-color:#128c2e;color:#ffffff;padding:12px 24px;border-radius:30px;text-decoration:none;font-weight:600;font-size:15px;">Get Started &nbsp;&#8594;</a>
                    </td>
                    <td width="52%" valign="middle" align="center">
                      <img src="${heroImageUrl}" alt="Welcome to GrowHive" width="300" style="display:block;width:100%;max-width:300px;height:auto;margin:auto;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fafbfc;border:1px solid #eeeeee;border-radius:12px;">
                  <tr>
                    <td width="25%" align="center" valign="top" style="padding:20px 8px;border-right:1px solid #eeeeee;"><span style="display:inline-block;width:44px;height:44px;line-height:44px;border-radius:50%;background:#e6f4ea;"><img src="${ICONS.userGroup}" width="20" height="20" alt="" style="display:block;width:20px;height:20px;margin:12px auto 0;" /></span><div style="margin-top:10px;font-size:13px;font-weight:700;color:#111111;">Find Opportunities</div><div style="margin-top:6px;color:#666666;font-size:11.5px;line-height:1.5;">Explore jobs, gigs, startups and more.</div></td>
                    <td width="25%" align="center" valign="top" style="padding:20px 8px;border-right:1px solid #eeeeee;"><span style="display:inline-block;width:44px;height:44px;line-height:44px;border-radius:50%;background:#e6f4ea;"><img src="${ICONS.handshake}" width="20" height="20" alt="" style="display:block;width:20px;height:20px;margin:12px auto 0;" /></span><div style="margin-top:10px;font-size:13px;font-weight:700;color:#111111;">Connect &amp; Collaborate</div><div style="margin-top:6px;color:#666666;font-size:11.5px;line-height:1.5;">Build valuable connections and collaborate.</div></td>
                    <td width="25%" align="center" valign="top" style="padding:20px 8px;border-right:1px solid #eeeeee;"><span style="display:inline-block;width:44px;height:44px;line-height:44px;border-radius:50%;background:#e6f4ea;"><img src="${ICONS.graduationCap}" width="20" height="20" alt="" style="display:block;width:20px;height:20px;margin:12px auto 0;" /></span><div style="margin-top:10px;font-size:13px;font-weight:700;color:#111111;">Learn &amp; Grow</div><div style="margin-top:6px;color:#666666;font-size:11.5px;line-height:1.5;">Access resources and upgrade your skills.</div></td>
                    <td width="25%" align="center" valign="top" style="padding:20px 8px;"><span style="display:inline-block;width:44px;height:44px;line-height:44px;border-radius:50%;background:#e6f4ea;"><img src="${ICONS.shieldHalved}" width="20" height="20" alt="" style="display:block;width:20px;height:20px;margin:12px auto 0;" /></span><div style="margin-top:10px;font-size:13px;font-weight:700;color:#111111;">Secure &amp; Trusted</div><div style="margin-top:6px;color:#666666;font-size:11.5px;line-height:1.5;">Your data and privacy are our priority.</div></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 30px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="top" style="padding-right:15px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td valign="top" style="padding-right:12px;"><span style="display:inline-block;width:38px;height:38px;line-height:38px;border-radius:50%;background:#e6f4ea;text-align:center;"><img src="${ICONS.heart}" width="17" height="17" alt="" style="display:block;width:17px;height:17px;margin:10px auto 0;" /></span></td>
                          <td valign="top">
                            <p style="margin:0 0 4px;font-size:14px;color:#444444;">Thank you for joining <strong>GrowHive.</strong></p>
                            <p style="margin:0;font-size:14px;color:#444444;">Together, let's build, collaborate and grow!</p>
                            <p style="margin:18px 0 0;font-weight:600;color:#444444;font-size:14px;">Best Regards,<br />The <span style="color:#128c2e;">GrowHive</span> Team</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td valign="middle" align="right">
                      <span style="font-family:'Segoe Script','Bradley Hand',cursive;font-style:italic;color:#128c2e;font-size:24px;">Happy Networking!</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 20px 16px;background-color:#fdfdfd;border-top:1px solid #eeeeee;">
                <div style="margin-bottom:12px;color:#777777;font-size:12px;">Stay connected with us</div>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 14px;"><tr>${socialBadgesHtml}</tr></table>
                <div style="color:#888888;font-size:11px;">&#169; ${new Date().getFullYear()} <span style="color:#128c2e;font-weight:600;">GrowHive</span>. All rights reserved.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
