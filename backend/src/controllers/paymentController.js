import crypto from "crypto";
import Subscription from "../models/Subscription.js";
import Payment from "../models/Payment.js";
import Service from "../models/Service.js";
import Application from "../models/Application.js";
import Contest from "../models/Contest.js";
import ContestEntry from "../models/ContestEntry.js";
import User from "../models/User.js";
import { getPlan } from "../config/plans.js";
import { getRazorpayClient, isRazorpayConfigured, getStripeClient, isStripeConfigured } from "../config/payments.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { notify } from "../utils/notify.js";

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

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: freelancerId,
    amount: service.price,
    type: "gig_order",
    extra: { service: service._id, note: service.title },
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

  const applicantId = typeof application.applicant === "object" ? application.applicant._id : application.applicant;

  const data = await createMarketplaceRazorpayOrder({
    payer: req.user._id,
    payee: applicantId,
    amount: application.proposedRate,
    type: "job_hire",
    extra: { application: application._id, note: job.title },
    receiptPrefix: "hire",
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
  const payment = await Payment.findOneAndUpdate(
    { providerOrderId, status: "pending" },
    { status: "paid", providerPaymentId },
    { new: true }
  );
  if (!payment) return null;

  if (payment.type === "gig_order" && payment.service) {
    await Service.findByIdAndUpdate(payment.service, { $inc: { ordersCount: 1 } });
  }
  return payment;
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
    await notify(req.app, {
      user: payment.payee,
      type: "system",
      title: "Payment received",
      message: `You received a payment of ₹${payment.amount}${payment.note ? ` for "${payment.note}"` : ""}.`,
      link: "/dashboard/freelancer/earnings",
    });
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
      await notify(req.app, {
        user: payment.payee,
        type: "system",
        title: "Payment received",
        message: `You received a payment of ₹${payment.amount}${payment.note ? ` for "${payment.note}"` : ""}.`,
        link: "/dashboard/freelancer/earnings",
      });
    } else {
      await finalizeSubscription({ providerOrderId: entity.order_id, providerPaymentId: entity.id });
    }
  }

  res.json({ received: true });
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
  const allPaid = await Payment.find({ payee: req.user._id, status: "paid" });
  const totalEarnings = allPaid.reduce((sum, p) => sum + p.amount, 0);
  const byType = allPaid.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + p.amount;
    return acc;
  }, {});

  const payments = await Payment.find({ payee: req.user._id, status: "paid" })
    .populate("payer", "name avatar")
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  res.json({
    success: true,
    data: {
      totalEarnings,
      byType,
      payments,
      pagination: { page: pageNum, limit: limitNum, total: allPaid.length, pages: Math.ceil(allPaid.length / limitNum) },
    },
  });
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
