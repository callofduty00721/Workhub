import User from "../shared/user.model.js";
import Withdrawal from "../finance/withdrawal.model.js";
import { getRazorpayClient, isRazorpayXConfigured } from "../../config/payments.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { earningsLinkForRole } from "../../utils/earningsLink.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

export const listWithdrawals = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Withdrawal.find(filter)
      .populate("freelancer", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Withdrawal.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

// Creates a RazorpayX Contact + Fund Account for the freelancer (if needed) and
// fires the actual Payout. Returns null (not an error) when RazorpayX isn't
// configured, so the caller can fall back to today's "admin sent it manually" flow.
async function attemptRazorpayXPayout(withdrawal, freelancer) {
  if (!isRazorpayXConfigured()) return null;
  const razorpay = getRazorpayClient();

  const contact = await razorpay.contacts.create({
    name: freelancer.name,
    email: freelancer.email,
    type: "vendor",
    reference_id: freelancer._id.toString(),
  });

  const fundAccount =
    withdrawal.method === "upi"
      ? await razorpay.fundAccount.create({
          contact_id: contact.id,
          account_type: "vpa",
          vpa: { address: withdrawal.upiId },
        })
      : await razorpay.fundAccount.create({
          contact_id: contact.id,
          account_type: "bank_account",
          bank_account: {
            name: withdrawal.bankAccountHolder,
            ifsc: withdrawal.bankIfsc,
            account_number: withdrawal.bankAccountNumber,
          },
        });

  return razorpay.payouts.create({
    account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
    fund_account_id: fundAccount.id,
    amount: Math.round(withdrawal.amount * 100),
    currency: "INR",
    mode: withdrawal.method === "upi" ? "UPI" : "IMPS",
    purpose: "payout",
    queue_if_low_balance: true,
    reference_id: withdrawal._id.toString(),
    narration: `GrowHive withdrawal ${withdrawal._id}`,
  });
}

export const resolveWithdrawal = asyncHandler(async (req, res) => {
  const { action, note } = req.body;

  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) throw new ApiError(404, "Withdrawal request not found");
  if (withdrawal.status !== "pending") throw new ApiError(400, "This withdrawal request has already been processed");

  // Fetched regardless of action — "reject" needs it too, just to route the
  // notification's link at the recipient's own Earnings/Wallet page (see
  // earningsLinkForRole) rather than always assuming "freelancer".
  const recipient = await User.findById(withdrawal.freelancer);

  let payout = null;
  if (action === "complete") {
    try {
      payout = await attemptRazorpayXPayout(withdrawal, recipient);
    } catch (err) {
      throw new ApiError(502, `RazorpayX payout failed: ${err.error?.description || err.message}`);
    }
  }

  withdrawal.status = action === "complete" ? "completed" : "rejected";
  withdrawal.provider = payout ? "razorpayx" : "manual";
  withdrawal.providerPayoutId = payout?.id || "";
  withdrawal.adminNote = note || "";
  withdrawal.processedAt = new Date();
  withdrawal.processedBy = req.user._id;
  await withdrawal.save();

  const destinationLabel =
    withdrawal.method === "upi" ? withdrawal.upiId : `${withdrawal.bankAccountHolder} · ${withdrawal.bankAccountNumber}`;

  await notify(req.app, {
    user: withdrawal.freelancer,
    type: "system",
    title:
      action === "complete"
        ? `₹${withdrawal.amount} withdrawal completed`
        : `₹${withdrawal.amount} withdrawal request rejected`,
    message:
      action === "complete"
        ? `Sent to ${destinationLabel}${payout ? " via RazorpayX" : ""}.${note ? ` Note: ${note}` : ""}`
        : note || "Contact support if you have questions.",
    link: earningsLinkForRole(recipient.role),
  });

  res.json({ success: true, data: withdrawal });
});
