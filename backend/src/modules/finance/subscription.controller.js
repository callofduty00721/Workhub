import crypto from "crypto";
import Subscription from "./subscription.model.js";
import Plan from "./plan.model.js";
import { getRazorpayClient, isRazorpayConfigured, getStripeClient, isStripeConfigured } from "../../config/payments.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

// Plans are per-role now — `role` picks which of the user's roles they're
// paying for (usually their active `role`, but the multi-role system lets
// someone hold roles they haven't switched into yet), `tier` picks free/pro/
// enterprise within it.
async function resolvePaidPlan(role, tier) {
  const plan = await Plan.findOne({ role, tier });
  if (!plan || plan.priceInInr <= 0) throw new ApiError(400, "Invalid plan selected");
  return plan;
}

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) {
    throw new ApiError(503, "Razorpay is not configured on this server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  const { role, tier } = req.body;
  const plan = await resolvePaidPlan(role, tier);

  const razorpay = getRazorpayClient();
  const amountInPaise = plan.priceInInr * 100;

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `mahahub_${req.user._id}_${Date.now()}`,
  });

  const subscription = await Subscription.create({
    user: req.user._id,
    role: plan.role,
    plan: plan.tier,
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

  const { role, tier } = req.body;
  const plan = await resolvePaidPlan(role, tier);

  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: { name: `MahaHub ${plan.name} Plan (${plan.role})` },
          unit_amount: plan.priceInInr * 100,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_URL}/pricing?status=success`,
    cancel_url: `${process.env.CLIENT_URL}/pricing?status=cancelled`,
    metadata: { userId: req.user._id.toString(), role: plan.role, tier: plan.tier },
  });

  await Subscription.create({
    user: req.user._id,
    role: plan.role,
    plan: plan.tier,
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
