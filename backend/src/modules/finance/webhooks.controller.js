import Payment from "../shared/payment.model.js";
import Service from "../../modules/marketplace/service.model.js";
import Milestone from "../jobs/milestone.model.js";
import TimeEntry from "../jobs/timeEntry.model.js";
import Application from "../shared/application.model.js";
import Subscription from "./subscription.model.js";
import { getCommissionPercent } from "./platformSettings.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { earningsLinkForPaymentType } from "../../utils/earningsLink.js";
import { verifyRazorpaySignature } from "../../utils/razorpaySignature.js";
import { CYCLE_DURATION_MS } from "../../utils/subscriptionCycle.js";

// Idempotent: only transitions a payment pending -> paid once, so it's safe to
// call this from both the client-side verify handler AND the webhook (whichever
// fires first wins; the other becomes a no-op via the `status: "pending"` filter).
async function finalizeMarketplacePayment({ providerOrderId, providerPaymentId }) {
  // The commission rate is looked up fresh here (not read from the document),
  // so it must be resolved before the atomic update below.
  const commissionPercent = await getCommissionPercent();

  // Contest prizes release immediately — picking a winner already implies approval.
  // Gig orders and job hires stay held in escrow until the payer explicitly releases them.
  // campaign_facilitation is neither: it's a fee paid straight to the platform for a
  // deal it never handles, so it's 100% commission, 0 net to the payee, released
  // immediately — there's nothing to hold since nothing is ever owed to the payee here.
  // The pipeline update keeps the "only transition pending -> paid once" check and the
  // type-dependent escrow/commission decision atomic in a single operation.
  const updated = await Payment.findOneAndUpdate(
    { providerOrderId, status: "pending" },
    [
      {
        $set: {
          status: "paid",
          providerPaymentId,
          escrowStatus: { $cond: [{ $in: ["$type", ["contest_prize", "campaign_facilitation"]] }, "released", "$escrowStatus"] },
          releasedAt: { $cond: [{ $in: ["$type", ["contest_prize", "campaign_facilitation"]] }, "$$NOW", "$releasedAt"] },
          commissionPercent: { $cond: [{ $eq: ["$type", "campaign_facilitation"] }, 100, commissionPercent] },
          commissionAmount: {
            $cond: [{ $eq: ["$type", "campaign_facilitation"] }, "$amount", { $round: [{ $multiply: ["$amount", commissionPercent / 100] }, 0] }],
          },
          netAmount: {
            $cond: [
              { $eq: ["$type", "campaign_facilitation"] },
              0,
              { $subtract: ["$amount", { $round: [{ $multiply: ["$amount", commissionPercent / 100] }, 0] }] },
            ],
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
  if (updated.type === "campaign_facilitation" && updated.application) {
    await Application.findByIdAndUpdate(updated.application, { offPlatformSettledAt: new Date() });
  }
  return updated;
}

async function notifyPaymentReceived(app, payment) {
  // A facilitation fee is platform revenue, not money the influencer ever
  // receives — the payee here must never be told anything was "credited to
  // your wallet". Both sides instead just get told the hire is now settled.
  if (payment.type === "campaign_facilitation") {
    await Promise.all([
      notify(app, {
        user: payment.payer,
        type: "system",
        title: "Off-platform hire settled",
        message: `Facilitation fee paid — this hire${payment.note ? ` ("${payment.note}")` : ""} is now marked settled off-platform.`,
        link: "/dashboard/employer/campaigns",
      }),
      notify(app, {
        user: payment.payee,
        type: "system",
        title: "Hire settled off-platform",
        message: `The brand has marked${payment.note ? ` "${payment.note}"` : " this hire"} as settled off-platform — GrowHive isn't holding any payment for it.`,
        link: "/dashboard/influencer",
      }),
    ]);
    return;
  }

  const held = payment.escrowStatus === "held";
  await notify(app, {
    user: payment.payee,
    type: "system",
    title: held ? "Payment received (in escrow)" : "Payment received",
    message: held
      ? `₹${payment.amount} was paid${payment.note ? ` for "${payment.note}"` : ""} and is held in escrow until the client approves and releases it.`
      : `₹${payment.amount} was credited to your wallet${payment.note ? ` for "${payment.note}"` : ""}.`,
    link: earningsLinkForPaymentType(payment.type),
  });
}

async function finalizeSubscription({ providerOrderId, providerPaymentId }) {
  const pending = await Subscription.findOne({ providerOrderId, status: "pending" });
  if (!pending) return null;
  return Subscription.findOneAndUpdate(
    { providerOrderId, status: "pending" },
    {
      status: "active",
      providerPaymentId,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + CYCLE_DURATION_MS[pending.billingCycle]),
    },
    { new: true }
  );
}

export const verifyMarketplacePayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const isValid = verifyRazorpaySignature(
    `${razorpay_order_id}|${razorpay_payment_id}`,
    razorpay_signature,
    process.env.RAZORPAY_KEY_SECRET
  );
  if (!isValid) {
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
  if (!verifyRazorpaySignature(req.body, signature, secret)) return res.status(400).send("Invalid webhook signature");

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
