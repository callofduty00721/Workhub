import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["user", "service", "startup"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

reviewSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1, targetType: 1, targetId: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
