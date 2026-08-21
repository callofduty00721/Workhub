import PDFDocument from "pdfkit";

// pdfkit's standard 14 fonts (Helvetica etc.) use WinAnsiEncoding, which has
// no glyph for ₹ (U+20B9) — it silently renders as a garbled superscript
// instead of erroring, so this went unnoticed until the actual PDF output
// was inspected. "Rs." avoids the encoding gap entirely; embedding a Unicode
// font just for this one symbol isn't worth the added asset/dependency. The
// web invoice page is unaffected — the browser renders ₹ natively there.
function money(amount, currency = "INR") {
  const prefix = currency === "USD" ? "$" : "Rs. ";
  return `${prefix}${Number(amount || 0).toFixed(2)}`;
}

// Streams a PDF invoice for a captured payment directly to the response.
// `payment` must have payer/payee populated with at least name + email.
export function streamInvoicePdf(payment, res) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${payment._id}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).font("Helvetica-Bold").text("GrowHive", { continued: false });
  doc.fontSize(10).font("Helvetica").fillColor("#64748b").text("Invoice / Payment Receipt");
  doc.moveDown(1.5);

  doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(`Invoice #${payment._id}`);
  doc.fontSize(9).font("Helvetica").fillColor("#64748b");
  doc.text(`Date: ${new Date(payment.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`);
  doc.text(`Status: ${payment.status.toUpperCase()}`);
  doc.moveDown(1);

  const colX = [50, 300];
  doc.fontSize(10).fillColor("#0f172a").font("Helvetica-Bold").text("Billed By (Freelancer)", colX[0], doc.y, { continued: false });
  const afterHeaderY = doc.y;
  doc.font("Helvetica-Bold").text("Billed To (Client)", colX[1], afterHeaderY);

  doc.font("Helvetica").fontSize(9).fillColor("#334155");
  doc.text(payment.payee?.name || "—", colX[0], afterHeaderY + 16);
  doc.text(payment.payee?.email || "", colX[0]);
  doc.text(payment.payer?.name || "—", colX[1], afterHeaderY + 16);
  doc.text(payment.payer?.email || "", colX[1]);

  doc.moveDown(3);

  const tableTop = doc.y + 10;
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a");
  doc.text("Description", 50, tableTop);
  doc.text("Amount", 450, tableTop, { width: 90, align: "right" });
  doc.moveTo(50, tableTop + 16).lineTo(545, tableTop + 16).strokeColor("#e2e8f0").stroke();

  let rowY = tableTop + 24;
  doc.font("Helvetica").fillColor("#334155");
  const description = describePayment(payment);
  doc.text(description, 50, rowY, { width: 380 });
  doc.text(money(payment.amount, payment.currency), 450, rowY, { width: 90, align: "right" });
  rowY += 24;

  if (payment.commissionAmount > 0) {
    doc.fillColor("#64748b").fontSize(8.5);
    doc.text(`Platform commission (${payment.commissionPercent}%)`, 50, rowY, { width: 380 });
    doc.text(`- ${money(payment.commissionAmount, payment.currency)}`, 450, rowY, { width: 90, align: "right" });
    rowY += 20;
  }

  doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor("#e2e8f0").stroke();
  rowY += 10;

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a");
  doc.text("Total Paid", 50, rowY, { width: 380 });
  doc.text(money(payment.amount, payment.currency), 450, rowY, { width: 90, align: "right" });

  if (payment.netAmount > 0) {
    rowY += 20;
    doc.font("Helvetica").fontSize(9).fillColor("#16a34a");
    doc.text("Net to Freelancer", 50, rowY, { width: 380 });
    doc.text(money(payment.netAmount, payment.currency), 450, rowY, { width: 90, align: "right" });
  }

  doc.moveDown(4);
  doc.fontSize(8).fillColor("#94a3b8").text(
    "This is a system-generated receipt from GrowHive. For questions, contact support via the platform.",
    50,
    doc.y,
    { width: 495 }
  );

  doc.end();
}

function describePayment(payment) {
  if (payment.type === "gig_order") return `Gig order payment${payment.servicePackage?.title ? ` — ${payment.servicePackage.title} package` : ""}`;
  if (payment.type === "job_hire") return "Job / project payment";
  if (payment.type === "contest_prize") return "Contest prize payment";
  if (payment.type === "campaign") return "Influencer campaign payment";
  return "Payment";
}
