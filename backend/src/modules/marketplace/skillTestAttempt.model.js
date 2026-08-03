import mongoose from "mongoose";

const skillTestAttemptSchema = new mongoose.Schema(
  {
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skillTest: { type: mongoose.Schema.Types.ObjectId, ref: "SkillTest", required: true },
    skill: { type: String, required: true },
    scorePercent: { type: Number, required: true },
    passed: { type: Boolean, required: true },
  },
  { timestamps: true }
);

skillTestAttemptSchema.index({ freelancer: 1, skillTest: 1, createdAt: -1 });

export default mongoose.model("SkillTestAttempt", skillTestAttemptSchema);
