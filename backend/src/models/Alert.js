import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    keywords: [{ type: String, required: true }],
    remoteOnly: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

alertSchema.index({ user: 1 });
alertSchema.index({ isActive: 1 });

export default mongoose.model("Alert", alertSchema);
