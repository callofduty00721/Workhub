import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
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
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
