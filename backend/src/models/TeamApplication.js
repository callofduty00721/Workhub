import mongoose from "mongoose";

const teamApplicationSchema = new mongoose.Schema(
  {
    startup: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roleTitle: { type: String, required: true },
    roleType: { type: String, enum: ["full_time", "part_time"], default: "full_time" },
    isCustomRole: { type: Boolean, default: false },
    bio: { type: String, required: true },
    experience: { type: String, required: true },
    skills: [{ type: String }],
    resumeUrl: { type: String, default: "" },
    status: { type: String, enum: ["pending", "reviewing", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

teamApplicationSchema.index({ startup: 1, createdAt: -1 });

export default mongoose.model("TeamApplication", teamApplicationSchema);
