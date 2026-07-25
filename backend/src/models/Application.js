import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    // Polymorphic — an application is either against a Job (salaried) or a
    // Project (bid-based); onModel picks which collection `job` populates
    // from. Kept the field named "job" rather than renaming, since payment/
    // contract/milestone code across the app already reads `application.job`
    // and only ever needs employer/title/company off of it — both models
    // shape those fields identically, so no other code has to change.
    onModel: { type: String, enum: ["Job", "Project"], default: "Job" },
    job: { type: mongoose.Schema.Types.ObjectId, refPath: "onModel", required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coverLetter: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    // Only meaningful for freelance/contract-type jobs — the bid the
    // freelancer is proposing, distinct from the job's posted salary range.
    proposedRate: { type: Number, default: 0 },
    deliveryDays: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "interview", "rejected", "hired", "withdrawn"],
      default: "applied",
    },
    withdrawnAt: { type: Date },
    // Lightweight e-signature: a plain-text agreement generated once the
    // freelancer is hired, which both sides must "sign" (type their name)
    // before any payment can be made against this application.
    contract: {
      text: { type: String, default: "" },
      employerSignedAt: { type: Date },
      employerSignatureName: { type: String, default: "" },
      freelancerSignedAt: { type: Date },
      freelancerSignatureName: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
