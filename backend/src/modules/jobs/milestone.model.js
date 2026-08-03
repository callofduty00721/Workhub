import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    order: { type: Number, default: 0 },
    // pending: not yet paid. funded: client paid, held in escrow. released: client
    // approved the work and the freelancer's wallet was credited.
    status: { type: String, enum: ["pending", "funded", "released"], default: "pending" },
  },
  { timestamps: true }
);

milestoneSchema.index({ application: 1, order: 1 });

export default mongoose.model("Milestone", milestoneSchema);
