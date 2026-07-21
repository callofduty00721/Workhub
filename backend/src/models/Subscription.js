import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["free", "starter", "professional", "enterprise"], default: "free" },
    provider: { type: String, enum: ["razorpay", "stripe"], required: true },
    providerOrderId: { type: String, default: "" },
    providerPaymentId: { type: String, default: "" },
    providerSubscriptionId: { type: String, default: "" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["pending", "active", "failed", "cancelled", "expired"], default: "pending" },
    startedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);
