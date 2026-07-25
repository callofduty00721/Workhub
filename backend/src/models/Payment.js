import mongoose from "mongoose";

const PAYMENT_TYPES = ["gig_order", "job_hire", "contest_prize"];
// Work-delivery lifecycle, tracked only for non-milestone gig_order/job_hire
// payments (contest prizes and milestone-linked payments release on their own
// terms and stay "not_applicable" here).
const ORDER_STATUSES = ["not_applicable", "in_progress", "delivered", "revision_requested", "completed"];

const paymentSchema = new mongoose.Schema(
  {
    payer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    payee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: PAYMENT_TYPES, required: true },
    amount: { type: Number, required: true, min: 0 },
    // Snapshotted from PlatformSettings when the payment is captured (status
    // becomes "paid"), so later commission-rate changes never retroactively
    // affect a payment that's already in flight. The client only ever sees
    // `amount` (what they paid); `netAmount` is what actually lands in the
    // freelancer's wallet once released.
    commissionPercent: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    provider: { type: String, enum: ["razorpay"], default: "razorpay" },
    providerOrderId: { type: String, default: "" },
    providerPaymentId: { type: String, default: "" },
    status: { type: String, enum: ["pending", "paid", "failed", "refunded", "partially_refunded"], default: "pending" },
    // Once status="paid", funds sit "held" in escrow until the payer approves the
    // work and releases them — only then do they count toward the payee's
    // withdrawable wallet balance. Contest prizes release immediately since
    // picking a winner already implies approval.
    escrowStatus: { type: String, enum: ["held", "released"], default: "held" },
    releasedAt: { type: Date },
    refundedAmount: { type: Number, default: 0, min: 0 },
    disputeStatus: { type: String, enum: ["none", "raised", "refunded", "rejected"], default: "none" },
    disputeReason: { type: String, default: "" },
    disputeResolutionNote: { type: String, default: "" },
    disputeRaisedAt: { type: Date },
    // Set by the daily escalation job once a dispute has sat unresolved past
    // the response window — surfaces it to admins as urgent, doesn't auto-refund.
    disputeEscalated: { type: Boolean, default: false },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    // Snapshotted from the chosen Service.packages entry at order time (if the
    // gig has tiers) — keeps the order's price/delivery/revisions fixed even
    // if the freelancer edits the gig's packages afterwards.
    servicePackage: {
      name: { type: String, default: "" },
      title: { type: String, default: "" },
      price: { type: Number },
      deliveryDays: { type: Number },
      revisions: { type: Number },
    },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
    milestone: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone" },
    // Set only for hourly work-diary payments — which logged hours this
    // payment is settling, so they can be marked billed once it's captured.
    timeEntryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "TimeEntry" }],
    contest: { type: mongoose.Schema.Types.ObjectId, ref: "Contest" },
    contestEntry: { type: mongoose.Schema.Types.ObjectId, ref: "ContestEntry" },
    note: { type: String, default: "" },

    // Delivery / revision workflow (gig_order and non-milestone job_hire only)
    orderStatus: { type: String, enum: ORDER_STATUSES, default: "not_applicable" },
    deadline: { type: Date },
    deliverables: [{ url: { type: String, required: true }, name: { type: String, default: "" } }],
    deliveryNote: { type: String, default: "" },
    deliveredAt: { type: Date },
    revisionsAllowed: { type: Number, default: 1 },
    revisionsUsed: { type: Number, default: 0 },
    revisionRequestReason: { type: String, default: "" },
    extensionRequest: {
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      proposedDeadline: { type: Date },
      reason: { type: String, default: "" },
      status: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
    },
  },
  { timestamps: true }
);

paymentSchema.index({ payee: 1, status: 1, escrowStatus: 1 });
paymentSchema.index({ payer: 1, status: 1 });

export const PAYMENT_TYPE_VALUES = PAYMENT_TYPES;
export const ORDER_STATUS_VALUES = ORDER_STATUSES;
export default mongoose.model("Payment", paymentSchema);
