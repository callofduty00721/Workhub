import Payment from "../shared/payment.model.js";
import Withdrawal from "./withdrawal.model.js";
import Service from "../../modules/marketplace/service.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { streamInvoicePdf } from "../../utils/invoice.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

export const getMyEarnings = asyncHandler(async (req, res) => {
  // Callers that need the full set for correctness checks (e.g. "have I already
  // been paid for this application?") can pass a high limit; the Earnings page
  // itself uses the small default for real pagination.
  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 200 });

  // Totals must reflect ALL paid payments, not just the current page, so they're
  // computed separately from the paginated list below.
  const [allPaid, withdrawnAgg, pendingWithdrawalAgg] = await Promise.all([
    Payment.find({ payee: req.user._id, status: "paid" }),
    Withdrawal.aggregate([
      { $match: { freelancer: req.user._id, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Withdrawal.aggregate([
      { $match: { freelancer: req.user._id, status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  // Earnings are shown net of platform commission — this is what the freelancer
  // actually takes home, which is the number that matters to them.
  const totalEarnings = allPaid.reduce((sum, p) => sum + p.netAmount, 0);
  const byType = allPaid.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + p.netAmount;
    return acc;
  }, {});

  const heldAmount = allPaid.filter((p) => p.escrowStatus === "held").reduce((sum, p) => sum + p.netAmount, 0);
  const releasedAmount = totalEarnings - heldAmount;
  const withdrawnTotal = withdrawnAgg[0]?.total ?? 0;
  const pendingWithdrawal = pendingWithdrawalAgg[0]?.total ?? 0;
  const availableBalance = Math.max(0, releasedAmount - withdrawnTotal - pendingWithdrawal);

  // The order LIST (below) also includes gig orders belonging to teammates on
  // the same agency, so they can jointly deliver/manage them — but the wallet
  // totals above stay strictly this user's own payee earnings, since that
  // money only ever lands in the original payee's own withdrawable balance.
  let paymentsFilter = { payee: req.user._id, status: "paid" };
  if (req.user.company) {
    const teamServiceIds = await Service.find({ company: req.user.company }).distinct("_id");
    if (teamServiceIds.length) {
      paymentsFilter = { status: "paid", $or: [{ payee: req.user._id }, { type: "gig_order", service: { $in: teamServiceIds } }] };
    }
  }

  const [payments, paymentsTotal] = await Promise.all([
    Payment.find(paymentsFilter)
      .populate("payer", "name avatar")
      .populate("payee", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Payment.countDocuments(paymentsFilter),
  ]);

  res.json({
    success: true,
    data: {
      totalEarnings,
      byType,
      wallet: { heldAmount, releasedAmount, withdrawnTotal, pendingWithdrawal, availableBalance },
      payments,
      pagination: paginationMeta(pageNum, limitNum, paymentsTotal),
    },
  });
});

export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("payer", "name avatar email companyName")
    .populate("payee", "name avatar email");
  if (!payment) throw new ApiError(404, "Payment not found");

  const isPayer = payment.payer._id.toString() === req.user._id.toString();
  const isPayee = payment.payee._id.toString() === req.user._id.toString();
  if (!isPayer && !isPayee && req.user.role !== "super_admin") {
    throw new ApiError(403, "You don't have access to this payment");
  }

  res.json({ success: true, data: payment });
});

export const downloadInvoice = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("payer", "name email")
    .populate("payee", "name email");
  if (!payment) throw new ApiError(404, "Payment not found");

  const isPayer = payment.payer._id.toString() === req.user._id.toString();
  const isPayee = payment.payee._id.toString() === req.user._id.toString();
  if (!isPayer && !isPayee && req.user.role !== "super_admin") {
    throw new ApiError(403, "You don't have access to this payment");
  }
  if (payment.status !== "paid") throw new ApiError(400, "Invoice is only available for paid payments");

  streamInvoicePdf(payment, res);
});

export const getMyPayments = asyncHandler(async (req, res) => {
  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 200 });

  const [items, total, paidAgg] = await Promise.all([
    Payment.find({ payer: req.user._id })
      .populate("payee", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Payment.countDocuments({ payer: req.user._id }),
    Payment.aggregate([
      { $match: { payer: req.user._id, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  res.json({
    success: true,
    data: items,
    totalSpent: paidAgg[0]?.total ?? 0,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});
