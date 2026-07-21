import mongoose from "mongoose";

const contestEntrySchema = new mongoose.Schema(
  {
    contest: { type: mongoose.Schema.Types.ObjectId, ref: "Contest", required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    fileUrl: { type: String, default: "" },
    isWinner: { type: Boolean, default: false },
  },
  { timestamps: true }
);

contestEntrySchema.index({ contest: 1, freelancer: 1 }, { unique: true });

export default mongoose.model("ContestEntry", contestEntrySchema);
