import mongoose from "mongoose";

const jobAccessLogSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["viewed_details", "accepted_nda", "viewed_attachment"], required: true },
    attachmentName: { type: String, default: "" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

jobAccessLogSchema.index({ job: 1, createdAt: -1 });

export default mongoose.model("JobAccessLog", jobAccessLogSchema);
