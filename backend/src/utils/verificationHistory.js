import VerificationAttempt from "../modules/shared/verificationAttempt.model.js";

// Called from a submit* controller right after the User document's own
// status/documents fields are set — records this submission permanently,
// independent of the fact that the User document's own field will get
// overwritten by the next resubmission.
export function logVerificationAttempt({ user, type, documents, selfie }) {
  return VerificationAttempt.create({
    user,
    type,
    documents: documents || [],
    selfie: selfie || "",
    status: "pending",
    submittedAt: new Date(),
  });
}

// Called from an admin review controller right after the User document's own
// status/note fields are updated — resolves the most recent still-pending
// attempt for this user+type so the history reflects the same decision.
// Returns null if none is found (shouldn't happen in practice, since review
// controllers already guard on the User document's status being "pending").
export async function resolveVerificationAttempt({ user, type, approved, note, reviewedBy }) {
  const attempt = await VerificationAttempt.findOne({ user, type, status: "pending" }).sort({ submittedAt: -1 });
  if (!attempt) return null;

  attempt.status = approved ? "verified" : "rejected";
  attempt.reviewNote = note || "";
  attempt.reviewedBy = reviewedBy;
  attempt.reviewedAt = new Date();
  await attempt.save();
  return attempt;
}
