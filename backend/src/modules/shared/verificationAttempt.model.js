import mongoose from "mongoose";

const VERIFICATION_TYPES = ["kyc", "face", "address", "bank", "role"];

// Every submit-then-review verification flow on User (kyc/face/address/bank/role)
// keeps only a single overwritable slot on the User document itself — a
// resubmission after rejection silently destroys the previous selfie/documents
// and the previous rejection reason. This collection is the append-only audit
// trail alongside that: one row per submission, independent of whatever the
// User document's current fields say, so admin can always see every past
// attempt (including rejected ones and why) for a given user.
const verificationAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: VERIFICATION_TYPES, required: true },
    // Only one of these is ever populated, matching the same split that
    // already exists on the User model: face verification submits a single
    // selfie string, everything else (kyc/address/bank/role) submits a
    // documents array.
    documents: [{ url: { type: String, required: true }, name: { type: String, default: "" } }],
    selfie: { type: String, default: "" },
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNote: { type: String, default: "" },
  },
  { timestamps: true }
);

verificationAttemptSchema.index({ user: 1, type: 1, submittedAt: -1 });

export const VERIFICATION_ATTEMPT_TYPE_VALUES = VERIFICATION_TYPES;
export default mongoose.model("VerificationAttempt", verificationAttemptSchema);
