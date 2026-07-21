import mongoose from "mongoose";

const PAYMENT_TYPES = ["gig_order", "job_hire", "contest_prize"];

const paymentSchema = new mongoose.Schema(
  {
    payer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    payee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: PAYMENT_TYPES, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    provider: { type: String, enum: ["razorpay"], default: "razorpay" },
    providerOrderId: { type: String, default: "" },
    providerPaymentId: { type: String, default: "" },
    status: { type: String, enum: ["pending", "paid", "failed", "refunded", "partially_refunded"], default: "pending" },
    refundedAmount: { type: Number, default: 0, min: 0 },
    disputeStatus: { type: String, enum: ["none", "raised", "refunded", "rejected"], default: "none" },
    disputeReason: { type: String, default: "" },
    disputeResolutionNote: { type: String, default: "" },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
    contest: { type: mongoose.Schema.Types.ObjectId, ref: "Contest" },
    contestEntry: { type: mongoose.Schema.Types.ObjectId, ref: "ContestEntry" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

paymentSchema.index({ payee: 1, status: 1 });
paymentSchema.index({ payer: 1, status: 1 });

export const PAYMENT_TYPE_VALUES = PAYMENT_TYPES;
export default mongoose.model("Payment", paymentSchema);
