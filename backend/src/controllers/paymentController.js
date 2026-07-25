import crypto from "crypto";
import Subscription from "../models/Subscription.js";
import Payment from "../models/Payment.js";
import Service from "../models/Service.js";
import Application from "../models/Application.js";
import Contest from "../models/Contest.js";
import ContestEntry from "../models/ContestEntry.js";
import User from "../models/User.js";
import Withdrawal from "../models/Withdrawal.js";
import Milestone from "../models/Milestone.js";
import TimeEntry from "../models/TimeEntry.js";
import { refreshFreelancerLevel } from "../utils/freelancerLevel.js";
import { getCommissionPercent } from "../models/PlatformSettings.js";
import { getPlan } from "../config/plans.js";
import { getRazorpayClient, isRazorpayConfigured, getStripeClient, isStripeConfigured } from "../config/payments.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { notify } from "../utils/notify.js";
import { streamInvoicePdf } from "../utils/invoice.js";
import { creditReferralBonusOnFirstEarning } from "../utils/referral.js";

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) {
    throw new ApiError(503, "Razorpay is not configured on this server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  const plan = getPlan(req.body.planId);
  if (!plan || plan.priceInInr <= 0) throw new ApiError(400, "Invalid plan selected");

  const razorpay = getRazorpayClient();
  const amountInPaise = plan.priceInInr * 100;

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `mahahub_${req.user._id}_${Date.now()}`,
  });

  const subscription = await Subscription.create({
    user: req.user._id,
    plan: plan.id,
    provider: "razorpay",
    providerOrderId: order.id,
    amount: plan.priceInInr,
    currency: "INR",
    status: "pending",
  });

  res.status(201).json({
    success: true,
    data: { orderId: order.id, amount: amountInPaise, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID, subscriptionId: subscription._id },
  });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed: signature mismatch");
  }

  const subscription = await Subscription.findOneAndUpdate(
    { providerOrderId: razorpay_order_id, user: req.user._id },
    {
      status: "active",
      providerPaymentId: razorpay_payment_id,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    { new: true }
  );

  if (!subscription) throw new ApiError(404, "Subscription order not found");

  res.json({ success: true, data: subscription });
});

export const createStripeCheckout = asyncHandler(async (req, res) => {
  if (!isStripeConfigured()) {
    throw new ApiError(503, "Stripe is not configured on this server. Set STRIPE_SECRET_KEY.");
  }

  const plan = getPlan(req.body.planId);
  if (!plan || plan.priceInInr <= 0) throw new ApiError(400, "Invalid plan selected");

  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: { name: `MahaHub ${plan.name} Plan` },
          unit_amount: plan.priceInInr * 100,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_URL}/pricing?status=success`,
    cancel_url: `${process.env.CLIENT_URL}/pricing?status=cancelled`,
    metadata: { userId: req.user._id.toString(), planId: plan.id },
  });

  await Subscription.create({
    user: req.user._id,
    plan: plan.id,
    provider: "stripe",
    providerOrderId: session.id,
    amount: plan.priceInInr,
    currency: "INR",
    status: "pending",
  });

  res.status(201).json({ success: true, data: { checkoutUrl: session.url } });
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  if (!isStripeConfigured()) return res.status(503).end();

  const stripe = getStripeClient();
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await Subscription.findOneAndUpdate(
      { providerOrderId: session.id },
      {
        status: "active",
        providerPaymentId: session.payment_intent,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    );
  }

  res.json({ received: true });
});

export const getMySubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user._id, status: "active" }).sort({ createdAt: -1 });
  res.json({ success: true, data: subscription });
});

// --- Marketplace payments (gig orders, freelance job/project hires, contest prizes) ---

async function createMarketplaceRazorpayOrder({ payer, payee, amount, type, extra = {}, receiptPrefix }) {
  if (!isRazorpayConfigured()) {
    throw new ApiError(503, "Razorpay is not configured on this server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  if (!amount || amount <= 0) throw new ApiError(400, "This has no payable amount set");

  const razorpay = getRazorpayClient();
  const amountInPaise = Math.round(amount * 100);

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `${receiptPrefix}_${payer}_${Date.now()}`,
  });

  const payment = await Payment.create({
    payer,
    payee,
    type,
    amount,
    currency: "INR",
    provider: "razorpay",
    providerOrderId: order.id,
    status: "pending",
    ...extra,
  });

  return { orderId: order.id, amount: amountInPaise, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID, paymentId: payment._id };
}

export const createGigOrderPayment = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.serviceId);
  if (!service) throw new ApiError(404, "Gig not found");

  const freelancerId = typeof service.freelancer === "object" ? service.freelancer._id : service.freelancer;
  if (freelancerId.toString() === req.user._id.toString()) throw new ApiError(400, "You cannot order your own gig");

  const { packageName } = req.body;

  let amount = service.price;
  let servicePackage;
  let deliveryDays = service.deliveryDays;
  let revisionsAllowed = service.revisions ?? 1;
  if (service.packages?.length) {
    const pkg = service.packages.find((p) => p.name === packageName);
    if (!pkg) throw new ApiError(400, "Select a valid package (Basic, Standard, or Premium)");
    amount = pkg.price;
    deliveryDays = pkg.deliveryDays;
    revisionsAllowed = pkg.revisions ?? 1;
    servicePackage = { name: pkg.name, title: pkg.title, price: pkg.price, deliveryDays: pkg.deliveryDays, revisions: pkg.revisions };
  }

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: freelancerId,
    amount,
    type: "gig_order",
    extra: {
      service: service._id,
      note: service.title,
      ...(servicePackage && { servicePackage }),
      orderStatus: "in_progress",
      deadline: new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000),
      revisionsAllowed,
    },
    receiptPrefix: "gig",
  });

  res.status(201).json({ success: true, data });
});

export const createJobHirePayment = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.applicationId).populate("job");
  if (!application) throw new ApiError(404, "Application not found");

  const job = application.job;
  const employerId = typeof job.employer === "object" ? job.employer._id : job.employer;
  if (employerId.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the job poster can pay this freelancer");
  }
  if (application.status !== "hired") throw new ApiError(400, "You can only pay a freelancer you've hired");
  if (!application.proposedRate) throw new ApiError(400, "This application has no agreed bid amount to pay");
  if (!application.contract?.employerSignedAt || !application.contract?.freelancerSignedAt) {
    throw new ApiError(400, "Both parties must sign the contract before payment can be made");
  }

  const hasMilestones = await Milestone.exists({ application: application._id });
  if (hasMilestones) {
    throw new ApiError(400, "This project has milestones set up — pay them individually instead of the full amount");
  }

  const applicantId = typeof application.applicant === "object" ? application.applicant._id : application.applicant;
  const deliveryDays = application.deliveryDays || 7;

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: applicantId,
    amount: application.proposedRate,
    type: "job_hire",
    extra: {
      application: application._id,
      note: job.title,
      orderStatus: "in_progress",
      deadline: new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000),
      revisionsAllowed: 1,
    },
    receiptPrefix: "hire",
  });

  res.status(201).json({ success: true, data });
});

export const createMilestonePayment = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.milestoneId).populate({
    path: "application",
    populate: { path: "job" },
  });
  if (!milestone) throw new ApiError(404, "Milestone not found");
  if (milestone.status !== "pending") throw new ApiError(400, "This milestone has already been paid");

  const { application } = milestone;
  const job = application.job;
  const employerId = typeof job.employer === "object" ? job.employer._id : job.employer;
  if (employerId.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the job poster can pay this milestone");
  }
  if (!application.contract?.employerSignedAt || !application.contract?.freelancerSignedAt) {
    throw new ApiError(400, "Both parties must sign the contract before payment can be made");
  }

  const applicantId = typeof application.applicant === "object" ? application.applicant._id : application.applicant;

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: applicantId,
    amount: milestone.amount,
    type: "job_hire",
    extra: { application: application._id, milestone: milestone._id, note: `${job.title} — ${milestone.title}` },
    receiptPrefix: "milestone",
  });

  res.status(201).json({ success: true, data });
});

export const createHourlyPayment = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.applicationId).populate("job");
  if (!application) throw new ApiError(404, "Application not found");

  const job = application.job;
  const employerId = typeof job.employer === "object" ? job.employer._id : job.employer;
  if (employerId.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the job poster can pay for logged hours");
  }
  if (!application.proposedRate) throw new ApiError(400, "This application has no agreed hourly rate");
  if (!application.contract?.employerSignedAt || !application.contract?.freelancerSignedAt) {
    throw new ApiError(400, "Both parties must sign the contract before payment can be made");
  }

  const { timeEntryIds } = req.body;
  if (!Array.isArray(timeEntryIds) || timeEntryIds.length === 0) throw new ApiError(400, "Select at least one time entry to pay for");

  const entries = await TimeEntry.find({ _id: { $in: timeEntryIds }, application: application._id, billed: false });
  if (entries.length !== timeEntryIds.length) {
    throw new ApiError(400, "Some selected time entries are invalid, already billed, or don't belong to this application");
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const amount = Math.round(totalHours * application.proposedRate * 100) / 100;

  const applicantId = typeof application.applicant === "object" ? application.applicant._id : application.applicant;

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: applicantId,
    amount,
    type: "job_hire",
    extra: {
      application: application._id,
      timeEntryIds: entries.map((e) => e._id),
      note: `${job.title} — ${totalHours} logged hours`,
    },
    receiptPrefix: "hourly",
  });

  res.status(201).json({ success: true, data });
});

export const createContestPrizePayment = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.contestId);
  if (!contest) throw new ApiError(404, "Contest not found");
  if (contest.client.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the contest poster can pay the prize");
  }

  const entry = await ContestEntry.findOne({ _id: req.params.entryId, contest: contest._id });
  if (!entry) throw new ApiError(404, "Entry not found");
  if (!entry.isWinner) throw new ApiError(400, "You can only pay the prize to the chosen winner");

  const existing = await Payment.findOne({ contest: contest._id, type: "contest_prize", status: "paid" });
  if (existing) throw new ApiError(400, "The prize for this contest has already been paid");

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: entry.freelancer,
    amount: contest.prizeAmount,
    type: "contest_prize",
    extra: { contest: contest._id, contestEntry: entry._id, note: contest.title },
    receiptPrefix: "prize",
  });

  res.status(201).json({ success: true, data });
});

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

export const releasePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.payer.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the payer can release this payment from escrow");
  }
  if (payment.status !== "paid") throw new ApiError(400, "Only completed payments can be released");
  if (payment.escrowStatus !== "held") throw new ApiError(400, "This payment is not held in escrow");

  payment.escrowStatus = "released";
  payment.releasedAt = new Date();
  await payment.save();

  if (payment.milestone) {
    await Milestone.findByIdAndUpdate(payment.milestone, { status: "released" });
  }
  refreshFreelancerLevel(payment.payee).catch(() => {});
  creditReferralBonusOnFirstEarning(payment.payee, req.app).catch(() => {});

  await notify(req.app, {
    user: payment.payee,
    type: "system",
    title: "Payment released to your wallet",
    message: `₹${payment.amount}${payment.note ? ` for "${payment.note}"` : ""} was approved and is now available in your wallet.`,
    link: "/dashboard/freelancer/earnings",
  });

  res.json({ success: true, data: payment });
});

// A gig_order payment's payee can be helped by any teammate on the same
// agency/Company as the gig itself — money still only ever lands in the
// original payee's wallet, but delivery/scheduling actions are collaborative.
async function isPayeeOrGigTeammate(payment, user) {
  if (payment.payee.toString() === user._id.toString()) return true;
  if (payment.type !== "gig_order" || !payment.service || !user.company) return false;
  const service = await Service.findById(payment.service).select("company");
  return !!(service?.company && service.company.toString() === user.company.toString());
}

export const deliverWork = asyncHandler(async (req, res) => {
  const { deliverables = [], note = "" } = req.body;
  if (!Array.isArray(deliverables) || deliverables.filter((d) => d.url?.trim()).length === 0) {
    throw new ApiError(400, "Add at least one deliverable link");
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (!(await isPayeeOrGigTeammate(payment, req.user))) throw new ApiError(403, "Only the freelancer can deliver this order");
  if (payment.status !== "paid") throw new ApiError(400, "This order isn't paid yet");
  if (!["in_progress", "revision_requested"].includes(payment.orderStatus)) {
    throw new ApiError(400, "This order isn't awaiting delivery");
  }

  payment.orderStatus = "delivered";
  payment.deliverables = deliverables.filter((d) => d.url?.trim()).map((d) => ({ url: d.url.trim(), name: d.name || "" }));
  payment.deliveryNote = note;
  payment.deliveredAt = new Date();
  await payment.save();

  await notify(req.app, {
    user: payment.payer,
    type: "system",
    title: "Work delivered",
    message: `Your order${payment.note ? ` for "${payment.note}"` : ""} has been delivered. Review it and accept or request a revision.`,
    link: "/dashboard/payments",
  });

  res.json({ success: true, data: payment });
});

export const acceptDelivery = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.payer.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only the client can accept this delivery");
  }
  if (payment.orderStatus !== "delivered") throw new ApiError(400, "This order hasn't been delivered yet");

  payment.orderStatus = "completed";
  if (payment.escrowStatus === "held") {
    payment.escrowStatus = "released";
    payment.releasedAt = new Date();
  }
  await payment.save();
  refreshFreelancerLevel(payment.payee).catch(() => {});
  creditReferralBonusOnFirstEarning(payment.payee, req.app).catch(() => {});

  await notify(req.app, {
    user: payment.payee,
    type: "system",
    title: "Delivery accepted — payment released",
    message: `₹${payment.amount}${payment.note ? ` for "${payment.note}"` : ""} was accepted and is now available in your wallet.`,
    link: "/dashboard/freelancer/earnings",
  });

  res.json({ success: true, data: payment });
});

export const requestRevision = asyncHandler(async (req, res) => {
  const { reason = "" } = req.body;

  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.payer.toString() !== req.user._id.toString()) throw new ApiError(403, "Only the client can request a revision");
  if (payment.orderStatus !== "delivered") throw new ApiError(400, "This order hasn't been delivered yet");
  if (payment.revisionsAllowed !== -1 && payment.revisionsUsed >= payment.revisionsAllowed) {
    throw new ApiError(400, "No revisions left on this order — accept the delivery or raise a dispute instead");
  }

  payment.orderStatus = "revision_requested";
  payment.revisionsUsed += 1;
  payment.revisionRequestReason = reason;
  await payment.save();

  await notify(req.app, {
    user: payment.payee,
    type: "system",
    title: "Revision requested",
    message: `The client requested a revision on your order${payment.note ? ` for "${payment.note}"` : ""}.${reason ? ` Reason: ${reason}` : ""}`,
    link: "/dashboard/freelancer/orders",
  });

  res.json({ success: true, data: payment });
});

export const requestExtension = asyncHandler(async (req, res) => {
  const { proposedDeadline, reason = "" } = req.body;
  if (!proposedDeadline) throw new ApiError(400, "Propose a new deadline date");

  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");

  const isPayer = payment.payer.toString() === req.user._id.toString();
  const isPayee = await isPayeeOrGigTeammate(payment, req.user);
  if (!isPayer && !isPayee) throw new ApiError(403, "You're not part of this order");
  if (!["in_progress", "revision_requested"].includes(payment.orderStatus)) {
    throw new ApiError(400, "This order isn't active");
  }
  if (payment.extensionRequest?.status === "pending") {
    throw new ApiError(400, "There's already a pending extension request on this order");
  }

  payment.extensionRequest = { requestedBy: req.user._id, proposedDeadline, reason, status: "pending" };
  await payment.save();

  await notify(req.app, {
    user: isPayer ? payment.payee : payment.payer,
    type: "system",
    title: "Deadline extension requested",
    message: `A new deadline of ${new Date(proposedDeadline).toLocaleDateString()} was proposed for your order${payment.note ? ` "${payment.note}"` : ""}.`,
    link: "/dashboard/payments",
  });

  res.json({ success: true, data: payment });
});

export const respondExtension = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!["approve", "reject"].includes(action)) throw new ApiError(400, "Invalid action");

  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.extensionRequest?.status !== "pending") throw new ApiError(400, "There's no pending extension request on this order");
  if (payment.extensionRequest.requestedBy.toString() === req.user._id.toString()) {
    throw new ApiError(403, "You can't respond to your own extension request");
  }

  const isPayer = payment.payer.toString() === req.user._id.toString();
  const isPayee = await isPayeeOrGigTeammate(payment, req.user);
  if (!isPayer && !isPayee) throw new ApiError(403, "You're not part of this order");

  if (action === "approve") {
    payment.deadline = payment.extensionRequest.proposedDeadline;
    payment.extensionRequest.status = "approved";
  } else {
    payment.extensionRequest.status = "rejected";
  }
  await payment.save();

  await notify(req.app, {
    user: payment.extensionRequest.requestedBy,
    type: "system",
    title: action === "approve" ? "Deadline extension approved" : "Deadline extension rejected",
    message: `Your extension request${payment.note ? ` for "${payment.note}"` : ""} was ${action === "approve" ? "approved" : "rejected"}.`,
    link: "/dashboard/payments",
  });

  res.json({ success: true, data: payment });
});

export const getMyEarnings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  // Callers that need the full set for correctness checks (e.g. "have I already
  // been paid for this application?") can pass a high limit; the Earnings page
  // itself uses the small default for real pagination.
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));

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
      .skip((pageNum - 1) * limitNum)
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
      pagination: { page: pageNum, limit: limitNum, total: paymentsTotal, pages: Math.ceil(paymentsTotal / limitNum) },
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
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total, paidAgg] = await Promise.all([
    Payment.find({ payer: req.user._id })
      .populate("payee", "name avatar")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
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
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const raiseDispute = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) throw new ApiError(400, "Please describe the issue");

  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.payer.toString() !== req.user._id.toString()) throw new ApiError(403, "You can only dispute your own payments");
  if (payment.status !== "paid") throw new ApiError(400, "Only completed payments can be disputed");
  if (payment.disputeStatus !== "none") throw new ApiError(400, "This payment already has a dispute on record");

  payment.disputeStatus = "raised";
  payment.disputeReason = reason.trim();
  payment.disputeRaisedAt = new Date();
  payment.disputeEscalated = false;
  await payment.save();

  await notify(req.app, {
    user: payment.payee,
    type: "system",
    title: "A payment you received was disputed",
    message: `${req.user.name} raised a dispute on a payment of ₹${payment.amount}. An admin will review it.`,
    link: "/dashboard/freelancer/earnings",
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

  const { amount, method, upiId, bankAccountNumber, bankIfsc, bankAccountHolder } = req.body;
  if (!amount || amount <= 0) throw new ApiError(400, "Enter a valid withdrawal amount");
  if (!["upi", "bank"].includes(method)) throw new ApiError(400, "Invalid withdrawal method");

  const payload = { freelancer: req.user._id, amount, method };
  if (method === "upi") {
    if (!upiId || !upiId.trim()) throw new ApiError(400, "Enter your UPI ID");
    payload.upiId = upiId.trim();
  } else {
    if (!bankAccountNumber?.trim() || !bankIfsc?.trim() || !bankAccountHolder?.trim()) {
      throw new ApiError(400, "Enter your account number, IFSC code, and account holder name");
    }
    payload.bankAccountNumber = bankAccountNumber.trim();
    payload.bankIfsc = bankIfsc.trim().toUpperCase();
    payload.bankAccountHolder = bankAccountHolder.trim();
  }

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
