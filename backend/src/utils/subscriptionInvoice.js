import puppeteer from "puppeteer";

// Same asset as emails/shared.js's header logo — kept as a separate constant
// since this module renders a full HTML page in a browser, not an email
// template. Emoji glyphs are deliberately avoided elsewhere in this
// template: Chromium embeds the full color-emoji font on any PDF that uses
// even one, which alone was found to add ~130KB to a ~90KB document.
const LOGO_MARK_URL =
  "https://res.cloudinary.com/bpcqn6kw/image/upload/e_trim/c_fit,h_80,w_80/v1787253084/growhive/email-assets/logo-mark.png";
const ICON_BASE = "https://res.cloudinary.com/bpcqn6kw/image/upload/c_fit,h_60,w_60";
const ICONS = {
  envelope: `${ICON_BASE}/v1787266415/growhive/email-assets/envelope-solid-full.png`,
  globe: `${ICON_BASE}/v1787266416/growhive/email-assets/globe-solid-full.png`,
  circleUser: `${ICON_BASE}/v1787266418/growhive/email-assets/circle-user-solid-full.png`,
  building: `${ICON_BASE}/v1787266420/growhive/email-assets/building-solid-full.png`,
};

// GrowHive isn't GST-registered and Subscription has no discount/coupon
// field, so this invoice deliberately has no GSTIN, HSN/SAC, discount, or
// CGST/SGST rows — those would be fabricated tax data on a real payment
// receipt. It's rendered from HTML/CSS via a headless Chromium instance
// (kept warm as a singleton — launching per-request is the slow part) rather
// than drawn primitive-by-primitive, so the layout can use real CSS (grid,
// rounded corners, shadows) instead of pdfkit's manual positioning.
let browserPromise = null;
function getBrowser() {
  browserPromise ??= puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  return browserPromise;
}

function money(amount, currency = "INR") {
  const prefix = currency === "USD" ? "$" : "₹";
  return `${prefix}${Number(amount || 0).toFixed(2)}`;
}

function planLabel(role) {
  return role
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function subscriptionInvoiceHtml(subscription) {
  const invoiceNumber = `GH-INV-${subscription._id.toString().slice(-8).toUpperCase()}`;
  const paymentMethod = subscription.provider === "stripe" ? "Stripe" : "Razorpay";
  const termsUrl = `${process.env.CLIENT_URL}/terms`;
  const name = escapeHtml(subscription.user?.name || "—");
  const email = escapeHtml(subscription.user?.email || "");
  const phone = escapeHtml(subscription.user?.phone || "");
  const amount = money(subscription.amount, subscription.currency);
  const description = `${planLabel(subscription.role)} — ${escapeHtml(subscription.plan)} plan (${subscription.billingCycle})`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#fff;font-family:Inter,Arial,Helvetica,sans-serif;color:#17231d;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .invoice{width:900px;margin:0 auto;background:#fff;padding:42px 44px;}
  .top{display:flex;justify-content:space-between;gap:35px;border-bottom:1px solid #dce5dd;padding-bottom:28px}
  .brand{display:flex;gap:14px;align-items:center}
  .logo{width:58px;height:58px;border-radius:16px;background:#dff1df;display:grid;place-items:center;color:#126a35;font-size:34px;}
  .brand h1{margin:0;color:#123c29;font-size:31px;letter-spacing:-1px}
  .brand p{margin:3px 0 0;color:#68756d;font-size:13px}
  .company{margin-top:22px;line-height:1.8;font-size:13px;color:#3d4942}
  .title{text-align:right}
  .title h2{margin:0;color:#145d32;font-size:34px;letter-spacing:.5px}
  .badge{display:inline-block;margin-top:9px;padding:6px 16px;border-radius:20px;background:#eef7ec;color:#235d35;font-size:12px;font-weight:700}
  .meta{margin-top:22px;font-size:13px;line-height:2}
  .meta div{display:grid;grid-template-columns:130px 14px 1fr;text-align:left}
  .meta b{font-weight:700}
  .paid{display:inline-block;background:#23853e;color:#fff;padding:3px 12px;border-radius:8px;font-weight:700;line-height:1.4}
  .section-grid{display:grid;grid-template-columns:1fr 1.25fr;margin-top:26px;border:1px solid #cddbcf;border-radius:15px;overflow:hidden}
  .panel{padding:22px}
  .panel + .panel{border-left:1px solid #cddbcf}
  .panel h3{margin:0 0 15px;color:#145d32;font-size:15px}
  .panel p{margin:6px 0;font-size:13px;line-height:1.55}
  .panel strong{font-size:16px}
  table{width:100%;border-collapse:collapse;margin-top:26px;font-size:13px}
  th{background:#116b35;color:#fff;padding:13px 10px;text-align:left}
  td{padding:15px 10px;border:1px solid #d8e1da;vertical-align:top}
  .num{text-align:right;white-space:nowrap}
  .summary-wrap{display:flex;justify-content:flex-end}
  .summary{width:52%;border-collapse:collapse;margin-top:0}
  .summary td{padding:12px 10px}
  .summary td:last-child{text-align:right;font-weight:600}
  .summary .total td{background:#eef7e9;color:#145d32;font-size:16px;font-weight:800}
  .features{display:grid;grid-template-columns:repeat(3,1fr);margin-top:24px;border:1px solid #cddbcf;border-radius:14px;overflow:hidden}
  .feature{padding:18px 15px;min-height:80px}
  .feature + .feature{border-left:1px solid #d7e0d8}
  .feature b{display:block;color:#174c2c;font-size:12px;margin-bottom:6px}
  .feature span{font-size:11px;line-height:1.45;color:#5b675f}
  .feature a{color:#116b35;font-weight:700;text-decoration:none}
  .footer{margin-top:24px;background:#116b35;color:#fff;text-align:center;padding:18px;border-radius:12px;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px}
  .icon-inline{display:inline-flex;align-items:center;gap:6px}
  .icon-inline img{display:block}
  .panel h3{display:flex;align-items:center;gap:7px}
</style>
</head>
<body>
<div class="invoice">
  <div class="top">
    <div>
      <div class="brand">
        <div class="logo"><img src="${LOGO_MARK_URL}" width="40" height="40" alt="" style="display:block;width:40px;height:40px;" /></div>
        <div>
          <h1>GrowHive</h1>
          <p>Grow Together, Thrive Better.</p>
        </div>
      </div>
      <div class="company">
        <span class="icon-inline"><img src="${ICONS.envelope}" width="12" height="12" alt="" /> support@growhive.in</span>
        &nbsp; • &nbsp;
        <span class="icon-inline"><img src="${ICONS.globe}" width="12" height="12" alt="" /> growhive.in</span>
      </div>
    </div>
    <div class="title">
      <h2>INVOICE</h2>
      <span class="badge">Payment Receipt</span>
      <div class="meta">
        <div><b>Invoice No.</b><span>:</span><span>${invoiceNumber}</span></div>
        <div><b>Invoice Date</b><span>:</span><span>${formatDate(subscription.createdAt)}</span></div>
        <div><b>Payment Date</b><span>:</span><span>${formatDate(subscription.startedAt || subscription.createdAt)}</span></div>
        <div><b>Payment Status</b><span>:</span><span><i class="paid">Paid</i></span></div>
        <div><b>Payment Method</b><span>:</span><span>${paymentMethod}</span></div>
        <div><b>Transaction ID</b><span>:</span><span>${escapeHtml(subscription.providerPaymentId || "—")}</span></div>
      </div>
    </div>
  </div>

  <div class="section-grid">
    <div class="panel">
      <h3><img src="${ICONS.circleUser}" width="15" height="15" alt="" /> BILL TO</h3>
      <p><strong>${name}</strong></p>
      <p>${email}${phone ? `<br>${phone}` : ""}</p>
    </div>
    <div class="panel">
      <h3><img src="${ICONS.building}" width="15" height="15" alt="" /> SUBSCRIPTION DETAILS</h3>
      <p><b>Plan Name</b> &nbsp; : &nbsp; ${planLabel(subscription.role)} — ${escapeHtml(subscription.plan)}</p>
      <p><b>Billing Cycle</b> &nbsp; : &nbsp; ${escapeHtml(subscription.billingCycle)}</p>
      <p><b>Subscription Period</b> &nbsp; : &nbsp; ${formatDate(subscription.startedAt)} – ${formatDate(subscription.expiresAt)}</p>
      <p><b>Status</b> &nbsp; : &nbsp; ${escapeHtml(subscription.status.toUpperCase())}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>#</th><th>Item Description</th><th>Qty</th><th class="num">Amount</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td><b>${description}</b></td>
        <td>1</td>
        <td class="num">${amount}</td>
      </tr>
    </tbody>
  </table>

  <div class="summary-wrap">
    <table class="summary">
      <tr class="total"><td>Amount Paid</td><td>${amount}</td></tr>
    </table>
  </div>

  <div class="features">
    <div class="feature"><b>Secure Payments</b><span>Your payment is processed securely by ${paymentMethod}.</span></div>
    <div class="feature"><b>Need Help?</b><span>support@growhive.in</span></div>
    <div class="feature"><b>Terms & Conditions</b><span>See <a href="${termsUrl}">our terms</a> for cancellations & more.</span></div>
  </div>

  <div class="footer"><img src="${LOGO_MARK_URL}" width="18" height="18" alt="" style="display:block;filter:brightness(0) invert(1);" /> Thank you for being a part of GrowHive!</div>
</div>
</body>
</html>`;
}

async function renderSubscriptionInvoicePdf(subscription) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(subscriptionInvoiceHtml(subscription), { waitUntil: "networkidle0" });
    return await page.pdf({ format: "A4", printBackground: true, margin: { top: "20px", bottom: "20px" } });
  } finally {
    await page.close();
  }
}

export async function streamSubscriptionInvoicePdf(subscription, res) {
  const pdfBuffer = await renderSubscriptionInvoicePdf(subscription);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${subscription._id}.pdf`);
  res.send(pdfBuffer);
}

export function getSubscriptionInvoicePdfBuffer(subscription) {
  return renderSubscriptionInvoicePdf(subscription);
}
