import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, enum: ["upi", "bank"], required: true },
    // Structured per-method fields (rather than one free-text string) so a
    // RazorpayX fund account can be created directly from them when payouts
    // are automated — bank transfers specifically need account number, IFSC,
    // and holder name as discrete fields, not a pasted blob.
    upiId: { type: String, default: "" },
    bankAccountNumber: { type: String, default: "" },
    bankIfsc: { type: String, default: "" },
    bankAccountHolder: { type: String, default: "" },
    status: { type: String, enum: ["pending", "completed", "rejected"], default: "pending" },
    // How the payout was actually sent: "razorpayx" when the automated API call
    // succeeded, "manual" when an admin sent the money themselves outside the app.
    provider: { type: String, enum: ["manual", "razorpayx"], default: "manual" },
    providerPayoutId: { type: String, default: "" },
    adminNote: { type: String, default: "" },
    processedAt: { type: Date },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

withdrawalSchema.index({ freelancer: 1, status: 1 });

export default mongoose.model("Withdrawal", withdrawalSchema);
