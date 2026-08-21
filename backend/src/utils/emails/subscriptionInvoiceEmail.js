// Sent on-demand from the "Email Invoice" button on SubscriptionInvoice.tsx —
// the PDF itself is attached (see emailSubscriptionInvoice in
// subscription.controller.js), so this body is just a short pointer to it.
// Not to be confused with utils/subscriptionInvoice.js, which draws the PDF
// itself.
export function subscriptionInvoiceEmailHtml(name, subscription) {
  const invoiceNumber = subscription._id.toString().slice(-8).toUpperCase();
  return `<p>Hi ${name},</p><p>Here's a copy of your GrowHive subscription invoice #${invoiceNumber}, attached as a PDF.</p><p>If you have any questions about this charge, contact support via the platform.</p>`;
}
