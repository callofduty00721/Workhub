import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Which role's plan this is — plans are now per-role (see plan.model.js),
    // so a subscription only makes sense in the context of one.
    role: { type: String, required: true },
    plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
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
