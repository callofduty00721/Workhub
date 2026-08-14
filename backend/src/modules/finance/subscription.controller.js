import Subscription from "./subscription.model.js";
import Plan from "./plan.model.js";
import { getRazorpayClient, isRazorpayConfigured, getStripeClient, isStripeConfigured } from "../../config/payments.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { verifyRazorpaySignature } from "../../utils/razorpaySignature.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const CYCLE_DURATION_MS = { monthly: 30 * DAY_MS, yearly: 365 * DAY_MS };

// Plans are per-role now — `role` picks which of the user's roles they're
// paying for (usually their active `role`, but the multi-role system lets
// someone hold roles they haven't switched into yet), `tier` picks free/pro/
// enterprise within it. `billingCycle` then picks which of the plan's two
// real stored prices applies — yearly isn't computed from monthly at
// checkout time, it's whatever an admin has set on the plan itself.
async function resolvePaidPlan(role, tier, billingCycle) {
  if (!CYCLE_DURATION_MS[billingCycle]) throw new ApiError(400, "billingCycle must be 'monthly' or 'yearly'");
  const plan = await Plan.findOne({ role, tier });
  const price = billingCycle === "yearly" ? plan?.priceInInrYearly : plan?.priceInInr;
  if (!plan || !price || price <= 0) throw new ApiError(400, "Invalid plan selected");
  return { plan, price };
}

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) {
    throw new ApiError(503, "Razorpay is not configured on this server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  const { role, tier, billingCycle = "monthly" } = req.body;
  const { plan, price } = await resolvePaidPlan(role, tier, billingCycle);

  const razorpay = getRazorpayClient();
  const amountInPaise = price * 100;

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `growhive_${req.user._id}_${Date.now()}`,
  });

  const subscription = await Subscription.create({
    user: req.user._id,
    role: plan.role,
    plan: plan.tier,
    billingCycle,
    provider: "razorpay",
    providerOrderId: order.id,
    amount: price,
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

  const isValid = verifyRazorpaySignature(
    `${razorpay_order_id}|${razorpay_payment_id}`,
    razorpay_signature,
    process.env.RAZORPAY_KEY_SECRET
  );
  if (!isValid) {
    throw new ApiError(400, "Payment verification failed: signature mismatch");
  }

  const pending = await Subscription.findOne({ providerOrderId: razorpay_order_id, user: req.user._id });
  if (!pending) throw new ApiError(404, "Subscription order not found");

  const subscription = await Subscription.findOneAndUpdate(
    { providerOrderId: razorpay_order_id, user: req.user._id },
    {
      status: "active",
      providerPaymentId: razorpay_payment_id,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + CYCLE_DURATION_MS[pending.billingCycle]),
    },
    { new: true }
  );

  res.json({ success: true, data: subscription });
});

export const createStripeCheckout = asyncHandler(async (req, res) => {
  if (!isStripeConfigured()) {
    throw new ApiError(503, "Stripe is not configured on this server. Set STRIPE_SECRET_KEY.");
  }

  const { role, tier, billingCycle = "monthly" } = req.body;
  const { plan, price } = await resolvePaidPlan(role, tier, billingCycle);

  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: { name: `GrowHive ${plan.name} Plan (${plan.role}, ${billingCycle})` },
          unit_amount: price * 100,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_URL}/pricing?status=success`,
    cancel_url: `${process.env.CLIENT_URL}/pricing?status=cancelled`,
    metadata: { userId: req.user._id.toString(), role: plan.role, tier: plan.tier, billingCycle },
  });

  await Subscription.create({
    user: req.user._id,
    role: plan.role,
    plan: plan.tier,
    billingCycle,
    provider: "stripe",
    providerOrderId: session.id,
    amount: price,
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
    const pending = await Subscription.findOne({ providerOrderId: session.id });
    if (pending) {
      await Subscription.updateOne(
        { providerOrderId: session.id },
        {
          status: "active",
          providerPaymentId: session.payment_intent,
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + CYCLE_DURATION_MS[pending.billingCycle]),
        }
      );
    }
  }

  res.json({ received: true });
});

// Scoped to the user's currently active role — plans are per-role (see
// Subscription.role), so someone holding multiple roles (e.g. freelancer +
// influencer, each with their own paid plan) must only ever see the
// subscription that matches whichever role they're currently viewing as,
// not just whichever of their subscriptions happens to be newest.
export const getMySubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user._id, role: req.user.role, status: "active" }).sort({
    createdAt: -1,
  });
  res.json({ success: true, data: subscription });
});
