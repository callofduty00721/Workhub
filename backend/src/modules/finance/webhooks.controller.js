import crypto from "crypto";
import Payment from "../shared/payment.model.js";
import Service from "../../modules/marketplace/service.model.js";
import Milestone from "../jobs/milestone.model.js";
import TimeEntry from "../jobs/timeEntry.model.js";
import Subscription from "./subscription.model.js";
import { getCommissionPercent } from "./platformSettings.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";

// Idempotent: only transitions a payment pending -> paid once, so it's safe to
// call this from both the client-side verify handler AND the webhook (whichever
// fires first wins; the other becomes a no-op via the `status: "pending"` filter).
async function finalizeMarketplacePayment({ providerOrderId, providerPaymentId }) {
  // The commission rate is looked up fresh here (not read from the document),
  // so it must be resolved before the atomic update below.
  const commissionPercent = await getCommissionPercent();

  // Contest prizes release immediately — picking a winner already implies approval.
  // Gig orders and job hires stay held in escrow until the payer explicitly releases them.
  // The pipeline update keeps the "only transition pending -> paid once" check and the
  // type-dependent escrow decision atomic in a single operation.
  const updated = await Payment.findOneAndUpdate(
    { providerOrderId, status: "pending" },
    [
      {
        $set: {
          status: "paid",
          providerPaymentId,
          escrowStatus: { $cond: [{ $eq: ["$type", "contest_prize"] }, "released", "$escrowStatus"] },
          releasedAt: { $cond: [{ $eq: ["$type", "contest_prize"] }, "$$NOW", "$releasedAt"] },
          commissionPercent,
          commissionAmount: { $round: [{ $multiply: ["$amount", commissionPercent / 100] }, 0] },
          netAmount: {
            $subtract: ["$amount", { $round: [{ $multiply: ["$amount", commissionPercent / 100] }, 0] }],
          },
        },
      },
    ],
    { new: true }
  );
  if (!updated) return null;

  if (updated.type === "gig_order" && updated.service) {
    await Service.findByIdAndUpdate(updated.service, { $inc: { ordersCount: 1 } });
  }
  if (updated.milestone) {
    await Milestone.findByIdAndUpdate(updated.milestone, { status: "funded" });
  }
  if (updated.timeEntryIds?.length) {
    await TimeEntry.updateMany({ _id: { $in: updated.timeEntryIds } }, { billed: true, payment: updated._id });
  }
  return updated;
}

async function notifyPaymentReceived(app, payment) {
  const held = payment.escrowStatus === "held";
  await notify(app, {
    user: payment.payee,
    type: "system",
    title: held ? "Payment received (in escrow)" : "Payment received",
    message: held
      ? `₹${payment.amount} was paid${payment.note ? ` for "${payment.note}"` : ""} and is held in escrow until the client approves and releases it.`
      : `₹${payment.amount} was credited to your wallet${payment.note ? ` for "${payment.note}"` : ""}.`,
    link: "/dashboard/freelancer/earnings",
  });
}

async function finalizeSubscription({ providerOrderId, providerPaymentId }) {
  return Subscription.findOneAndUpdate(
    { providerOrderId, status: "pending" },
    { status: "active", providerPaymentId, startedAt: new Date(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    { new: true }
  );
}

export const verifyMarketplacePayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed: signature mismatch");
  }

  const justFinalized = await finalizeMarketplacePayment({ providerOrderId: razorpay_order_id, providerPaymentId: razorpay_payment_id });
  // If null, the webhook likely already finalized it — look up the current state instead of erroring.
  const payment = justFinalized ?? (await Payment.findOne({ providerOrderId: razorpay_order_id, payer: req.user._id }));
  if (!payment) throw new ApiError(404, "Payment order not found");

  if (justFinalized) {
    await notifyPaymentReceived(req.app, payment);
  }

  res.json({ success: true, data: payment });
});

// Server-side fallback so a payment still gets marked "paid" even if the buyer
// closes their browser before the client-side verify handler runs.
export const razorpayWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).end();

  const signature = req.headers["x-razorpay-signature"];
  const expectedSignature = crypto.createHmac("sha256", secret).update(req.body).digest("hex");
  if (expectedSignature !== signature) return res.status(400).send("Invalid webhook signature");

  const event = JSON.parse(req.body.toString());

  if (event.event === "payment.captured") {
    const entity = event.payload.payment.entity;
    const payment = await finalizeMarketplacePayment({ providerOrderId: entity.order_id, providerPaymentId: entity.id });
    if (payment) {
      await notifyPaymentReceived(req.app, payment);
    } else {
      await finalizeSubscription({ providerOrderId: entity.order_id, providerPaymentId: entity.id });
    }
  }

  res.json({ received: true });
});
