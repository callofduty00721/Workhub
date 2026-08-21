import Payment from "../shared/payment.model.js";
import User from "../shared/user.model.js";
import { getRazorpayClient, isRazorpayConfigured } from "../../config/payments.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { refreshFreelancerLevel } from "../../utils/freelancerLevel.js";
import { earningsLinkForPaymentType } from "../../utils/earningsLink.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { safeSearchRegex } from "../../utils/searchRegex.js";

export const listPayments = asyncHandler(async (req, res) => {
  const { disputeStatus, type, status, search } = req.query;

  const filter = {};
  if (disputeStatus) filter.disputeStatus = disputeStatus;
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (search) {
    const regex = safeSearchRegex(search);
    const userIds = await User.find({ $or: [{ name: regex }, { email: regex }] }).distinct("_id");
    filter.$or = [{ payer: { $in: userIds } }, { payee: { $in: userIds } }];
  }

  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate("payer", "name email avatar")
      .populate("payee", "name email avatar")
      .populate("service", "title")
      .populate("contest", "title")
      .populate("milestone", "title amount status")
      .populate({ path: "application", select: "job", populate: { path: "job", select: "title" } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Payment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

export const resolveDispute = asyncHandler(async (req, res) => {
  const { action, note, refundAmount } = req.body;

  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.disputeStatus !== "raised") throw new ApiError(400, "This payment has no pending dispute");

  if (action === "refund") {
    const amountToRefund = refundAmount || payment.amount;
    if (amountToRefund > payment.amount) {
      throw new ApiError(400, `Refund amount must be between ₹1 and ₹${payment.amount}`);
    }

    if (isRazorpayConfigured() && payment.providerPaymentId) {
      const razorpay = getRazorpayClient();
      await razorpay.payments.refund(payment.providerPaymentId, { amount: Math.round(amountToRefund * 100) });
    }

    payment.refundedAmount = amountToRefund;
    payment.status = amountToRefund < payment.amount ? "partially_refunded" : "refunded";
    payment.disputeStatus = "refunded";
  } else {
    payment.disputeStatus = "rejected";
  }
  payment.disputeResolutionNote = note || "";
  payment.disputeResolvedBy = req.user._id;
  await payment.save();
  refreshFreelancerLevel(payment.payee).catch(() => {});

  await notify(req.app, {
    user: payment.payer,
    type: "system",
    title:
      action === "refund"
        ? `Your dispute was resolved: ₹${payment.refundedAmount} refunded`
        : "Your dispute was reviewed and rejected",
    message: note || "",
    link: "/dashboard/client/payments",
  });

  await notify(req.app, {
    user: payment.payee,
    type: "system",
    title:
      action === "refund"
        ? `A dispute on your payment was resolved with a ₹${payment.refundedAmount} refund`
        : "A dispute on your payment was rejected — no refund issued",
    message: note || "",
    link: earningsLinkForPaymentType(payment.type),
  });

  res.json({ success: true, data: payment });
});
