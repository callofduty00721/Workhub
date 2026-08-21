import Payment from "../shared/payment.model.js";
import Withdrawal from "./withdrawal.model.js";
import User from "../shared/user.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { earningsLinkForPaymentType } from "../../utils/earningsLink.js";

export const raiseDispute = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.payer.toString() !== req.user._id.toString()) throw new ApiError(403, "You can only dispute your own payments");
  if (payment.status !== "paid") throw new ApiError(400, "Only completed payments can be disputed");
  if (payment.disputeStatus !== "none") throw new ApiError(400, "This payment already has a dispute on record");

  payment.disputeStatus = "raised";
  payment.disputeReason = reason;
  payment.disputeRaisedAt = new Date();
  payment.disputeEscalated = false;
  await payment.save();

  await notify(req.app, {
    user: payment.payee,
    type: "system",
    title: "A payment you received was disputed",
    message: `${req.user.name} raised a dispute on a payment of ₹${payment.amount}. An admin will review it.`,
    link: earningsLinkForPaymentType(payment.type),
  });

  const admins = await User.find({ role: "super_admin" }).select("_id");
  await Promise.all(
    admins.map((admin) =>
      notify(req.app, {
        user: admin._id,
        type: "system",
        title: "New payment dispute raised",
        message: `${req.user.name} disputed a payment of ₹${payment.amount}${payment.note ? ` for "${payment.note}"` : ""}.`,
        link: "/dashboard/admin/payments",
      })
    )
  );

  res.json({ success: true, data: payment });
});

// --- Wallet / Withdrawals ---

async function getAvailableBalance(freelancerId) {
  const [releasedAgg, withdrawnAgg, pendingAgg] = await Promise.all([
    Payment.aggregate([
      { $match: { payee: freelancerId, status: "paid", escrowStatus: "released" } },
      { $group: { _id: null, total: { $sum: "$netAmount" } } },
    ]),
    Withdrawal.aggregate([
      { $match: { freelancer: freelancerId, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Withdrawal.aggregate([
      { $match: { freelancer: freelancerId, status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const released = releasedAgg[0]?.total ?? 0;
  const withdrawn = withdrawnAgg[0]?.total ?? 0;
  const pending = pendingAgg[0]?.total ?? 0;
  return Math.max(0, released - withdrawn - pending);
}

export const requestWithdrawal = asyncHandler(async (req, res) => {
  if (req.user.kycStatus !== "verified") {
    throw new ApiError(403, "Complete identity verification (KYC) before withdrawing your earnings");
  }
  if (!req.user.isEmailVerified) {
    throw new ApiError(403, "Verify your email address before withdrawing your earnings");
  }
  if (!req.user.isPhoneVerified) {
    throw new ApiError(403, "Verify your mobile number before withdrawing your earnings");
  }
  if (req.user.bankVerificationStatus !== "verified") {
    throw new ApiError(403, "Complete bank verification before withdrawing your earnings");
  }

  const { amount, method } = req.body;
  const payload =
    method === "upi"
      ? { freelancer: req.user._id, amount, method, upiId: req.body.upiId }
      : {
          freelancer: req.user._id,
          amount,
          method,
          bankAccountNumber: req.body.bankAccountNumber,
          bankIfsc: req.body.bankIfsc.toUpperCase(),
          bankAccountHolder: req.body.bankAccountHolder,
        };

  const availableBalance = await getAvailableBalance(req.user._id);
  if (amount > availableBalance) {
    throw new ApiError(400, `You can withdraw up to ₹${availableBalance} — your funds are either still in escrow or already withdrawn`);
  }

  const withdrawal = await Withdrawal.create(payload);

  res.status(201).json({ success: true, data: withdrawal });
});

export const getMyWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await Withdrawal.find({ freelancer: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: withdrawals });
});
