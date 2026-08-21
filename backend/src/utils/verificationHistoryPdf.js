import PDFDocument from "pdfkit";

const TYPE_LABELS = {
  kyc: "KYC (Identity)",
  face: "Face Verification",
  address: "Address Verification",
  bank: "Bank Verification",
  role: "Role Verification",
};

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif)(\?|$)/i;

async function fetchImageBuffer(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function statusColor(status) {
  if (status === "verified") return "#16a34a";
  if (status === "rejected") return "#dc2626";
  return "#d97706";
}

function groupByType(attempts) {
  const map = new Map();
  for (const attempt of attempts) {
    if (!map.has(attempt.type)) map.set(attempt.type, []);
    map.get(attempt.type).push(attempt);
  }
  return map;
}

// Embeds a document's image directly (fetched from its Cloudinary URL) when
// it looks like an image; falls back to a clickable link for anything else
// (PDFs, or an image fetch that failed) rather than silently dropping it.
async function renderAttachment(doc, { label, url }) {
  const looksLikeImage = IMAGE_EXT_RE.test(url);
  const buffer = looksLikeImage ? await fetchImageBuffer(url) : null;

  if (buffer) {
    if (doc.y > 600) doc.addPage();
    if (label) {
      doc.fontSize(8).font("Helvetica").fillColor("#64748b").text(label);
    }
    try {
      doc.image(buffer, { fit: [180, 140] });
    } catch {
      doc.fontSize(9).fillColor("#2563eb").text(url, { link: url, underline: true });
    }
    doc.moveDown(0.4);
  } else {
    doc.fontSize(9).font("Helvetica").fillColor("#2563eb").text(label || url, { link: url, underline: true });
  }
}

// Streams a PDF report of every verification attempt (kyc/face/address/bank/role)
// a user has ever submitted, grouped by type, including embedded document/selfie
// images where fetchable and the admin's decision + reason for each attempt.
export async function streamVerificationHistoryPdf(user, attempts, res) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="verification-history-${user._id}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).font("Helvetica-Bold").fillColor("#0f172a").text("GrowHive");
  doc.fontSize(10).font("Helvetica").fillColor("#64748b").text("Verification History Report");
  doc.moveDown(1);

  doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text(user.name);
  doc.fontSize(9).font("Helvetica").fillColor("#64748b").text(user.email);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`);
  doc.moveDown(1);

  if (attempts.length === 0) {
    doc.fontSize(10).fillColor("#64748b").text("This user has never submitted any verification request.");
    doc.end();
    return;
  }

  const byType = groupByType(attempts);

  for (const [type, list] of byType) {
    if (doc.y > 680) doc.addPage();
    doc.moveDown(0.5);
    doc.fontSize(13).font("Helvetica-Bold").fillColor("#0f172a").text(TYPE_LABELS[type] ?? type);
    doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor("#e2e8f0").stroke();
    doc.moveDown(0.5);

    const verifiedCount = list.filter((a) => a.status === "verified").length;
    const rejectedCount = list.filter((a) => a.status === "rejected").length;
    doc.fontSize(9).font("Helvetica").fillColor("#64748b");
    doc.text(`Total attempts: ${list.length}  ·  Approved: ${verifiedCount}  ·  Rejected: ${rejectedCount}`);
    doc.moveDown(0.5);

    let attemptNumber = 1;
    for (const attempt of list) {
      if (doc.y > 640) doc.addPage();

      doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a");
      doc.text(`Attempt ${attemptNumber} — submitted ${new Date(attempt.submittedAt).toLocaleString("en-IN")}`);

      doc.fontSize(9).font("Helvetica-Bold").fillColor(statusColor(attempt.status));
      doc.text(`Status: ${attempt.status.toUpperCase()}`);

      doc.font("Helvetica").fillColor("#334155");
      if (attempt.reviewedBy?.name) {
        doc.text(`Reviewed by: ${attempt.reviewedBy.name}${attempt.reviewedAt ? ` on ${new Date(attempt.reviewedAt).toLocaleString("en-IN")}` : ""}`);
      }
      if (attempt.status === "rejected" && attempt.reviewNote) {
        doc.fillColor("#dc2626").text(`Reason: ${attempt.reviewNote}`);
        doc.fillColor("#334155");
      }
      doc.moveDown(0.3);

      if (attempt.selfie) {
        await renderAttachment(doc, { label: "Selfie", url: attempt.selfie });
      }
      for (const document of attempt.documents || []) {
        await renderAttachment(doc, { label: document.name || "Document", url: document.url });
      }

      doc.moveDown(0.6);
      attemptNumber++;
    }
    doc.moveDown(0.3);
  }

  doc.end();
}
