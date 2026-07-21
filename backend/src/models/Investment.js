import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    startup: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
    investor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
    note: { type: String, default: "" },
    status: { type: String, enum: ["pending", "confirmed", "declined"], default: "pending" },
    confirmedAt: { type: Date },
    verified: { type: Boolean, default: false },
    verificationOrderId: { type: String, default: "" },
    verificationPaymentId: { type: String, default: "" },
    verifiedAt: { type: Date },
    refunded: { type: Boolean, default: false },
    refundAmount: { type: Number, default: 0 },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

investmentSchema.index({ startup: 1, createdAt: -1 });

export default mongoose.model("Investment", investmentSchema);
