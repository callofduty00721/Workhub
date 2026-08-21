import crypto from "crypto";
import Investment from "./investment.model.js";
import Startup from "./startup.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { getRazorpayClient, isRazorpayConfigured } from "../../config/payments.js";
import { assertStartupFounder } from "./founderAuth.js";
import { logger } from "../../utils/logger.js";

const VERIFICATION_FEE_INR = 199;
const REFUND_KEEP_PCT = 0.06; // platform keeps 6% (covers gateway fee + handling) on auto-refunds
const NO_RESPONSE_REFUND_DAYS = 15;

// `amount` itself is validated at the route level (investment.validation.js)
// before any of these controllers run, so this only checks business rules.
async function assertCanReportInvestment(startup, user) {
  if (startup.founder.toString() === user._id.toString()) {
    throw new ApiError(400, "You cannot report an investment in your own startup");
  }
  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before reporting an investment.");
  }

  const existingActive = await Investment.findOne({
    startup: startup._id,
    investor: user._id,
    status: { $in: ["pending", "confirmed"] },
  });
  if (existingActive) {
    throw new ApiError(400, "You already have an active investment report for this startup.");
  }
}

export const createInvestment = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.startupId);
  if (!startup) throw new ApiError(404, "Startup not found");
  await assertCanReportInvestment(startup, req.user);

  const investment = await Investment.create({
    startup: startup._id,
    investor: req.user._id,
    amount: req.body.amount,
    note: req.body.note || "",
  });
  await investment.populate("investor", "name avatar role createdAt");

  await notify(req.app, {
    user: startup.founder,
    type: "system",
    title: "New investment reported",
    message: `${req.user.name} reported an investment of ₹${req.body.amount} in ${startup.name}`,
    link: `/startups/${startup._id}`,
  });

  res.status(201).json({ success: true, data: investment });
});

export const listInvestments = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.startupId);
  if (!startup) throw new ApiError(404, "Startup not found");

  const isOwner = startup.founder.toString() === req.user._id.toString();
  const filter = { startup: startup._id };
  if (!isOwner) filter.investor = req.user._id;

  const investments = await Investment.find(filter).populate("investor", "name avatar role createdAt").sort({ createdAt: -1 });
  res.json({ success: true, data: investments });
});

export const updateInvestmentStatus = asyncHandler(async (req, res) => {
  const investment = await Investment.findById(req.params.id).populate("startup");
  if (!investment) throw new ApiError(404, "Investment not found");

  const startup = investment.startup;
  assertStartupFounder(startup, req.user, "Only the founder can confirm or decline investments");

  const { status } = req.body;

  const wasConfirmed = investment.status === "confirmed";
  const willBeConfirmed = status === "confirmed";

  if (!wasConfirmed && willBeConfirmed) {
    await Startup.updateOne({ _id: startup._id }, { $inc: { fundingRaised: investment.amount } });
  } else if (wasConfirmed && !willBeConfirmed) {
    await Startup.updateOne({ _id: startup._id }, { $inc: { fundingRaised: -investment.amount } });
  }

  investment.status = status;
  investment.confirmedAt = willBeConfirmed ? new Date() : undefined;
  await investment.save();

  if (willBeConfirmed) {
    await notify(req.app, {
      user: investment.investor,
      type: "system",
      title: "Investment confirmed",
      message: `The founder confirmed your ₹${investment.amount} investment in ${startup.name}`,
      link: `/startups/${startup._id}`,
    });
  }

  res.json({ success: true, data: investment });
});

export const createVerificationOrder = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) {
    throw new ApiError(503, "Razorpay is not configured on this server.");
  }

  const investment = await Investment.findById(req.params.id);
  if (!investment) throw new ApiError(404, "Investment not found");
  if (investment.investor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the investor who reported this can verify it.");
  }
  if (investment.verified) throw new ApiError(400, "This investment is already verified");

  const razorpay = getRazorpayClient();
  const amountInPaise = VERIFICATION_FEE_INR * 100;

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `mahahub_invverify_${investment._id}_${Date.now()}`,
  });

  investment.verificationOrderId = order.id;
  await investment.save();

  res.status(201).json({
    success: true,
    data: { orderId: order.id, amount: amountInPaise, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID },
  });
});

export const verifyVerificationPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const investment = await Investment.findById(req.params.id);
  if (!investment) throw new ApiError(404, "Investment not found");
  if (investment.investor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the investor who reported this can verify it.");
  }
  if (investment.verificationOrderId !== razorpay_order_id) {
    throw new ApiError(400, "Order mismatch");
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed: signature mismatch");
  }

  investment.verified = true;
  investment.verificationPaymentId = razorpay_payment_id;
  investment.verifiedAt = new Date();
  await investment.save();
  await investment.populate("investor", "name avatar role createdAt");

  res.json({ success: true, data: investment });
});

// Pay-before-submit flow: the investor pays the ₹199 verification fee first, and
// the investment report is only created once the payment is confirmed. Unlike
// createVerificationOrder (which verifies an *existing* report after the fact),
// this order isn't tied to any Investment document yet — it's just a Razorpay
// order for the flat fee, verified and turned into a report in one call below.
export const createPreInvestmentVerificationOrder = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) {
    throw new ApiError(503, "Razorpay is not configured on this server.");
  }

  const startup = await Startup.findById(req.params.startupId);
  if (!startup) throw new ApiError(404, "Startup not found");
  await assertCanReportInvestment(startup, req.user);

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: VERIFICATION_FEE_INR * 100,
    currency: "INR",
    receipt: `mahahub_preinvverify_${startup._id}_${req.user._id}_${Date.now()}`,
  });

  res.status(201).json({
    success: true,
    data: { orderId: order.id, amount: VERIFICATION_FEE_INR * 100, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID },
  });
});

export const createVerifiedInvestment = asyncHandler(async (req, res) => {
  const { amount, note, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const startup = await Startup.findById(req.params.startupId);
  if (!startup) throw new ApiError(404, "Startup not found");
  // Re-checked here (not just at order-creation time) in case anything changed
  // — e.g. another report was submitted — while the investor was paying.
  await assertCanReportInvestment(startup, req.user);

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed: signature mismatch");
  }

  const investment = await Investment.create({
    startup: startup._id,
    investor: req.user._id,
    amount,
    note: note || "",
    verified: true,
    verifiedAt: new Date(),
    verificationOrderId: razorpay_order_id,
    verificationPaymentId: razorpay_payment_id,
  });
  await investment.populate("investor", "name avatar role createdAt");

  await notify(req.app, {
    user: startup.founder,
    type: "system",
    title: "New verified investment reported",
    message: `${req.user.name} reported a verified investment of ₹${amount} in ${startup.name}`,
    link: `/startups/${startup._id}`,
  });

  res.status(201).json({ success: true, data: investment });
});

/**
 * Refunds the ₹199 verification fee (minus a 6% platform fee) for reports the
 * founder never acted on within NO_RESPONSE_REFUND_DAYS. Only the reporting fee
 * is refunded here — the reported investment amount itself never moved through
 * GrowHive, so there is nothing else to reverse. Intended to run on a recurring
 * timer (see jobs/investmentRefundJob.js), not as an HTTP route.
 */
export async function refundExpiredVerifications(app) {
  if (!isRazorpayConfigured()) return;

  const cutoff = new Date(Date.now() - NO_RESPONSE_REFUND_DAYS * 24 * 60 * 60 * 1000);
  const candidates = await Investment.find({
    verified: true,
    refunded: false,
    status: "pending",
    verifiedAt: { $lte: cutoff },
  }).populate("startup", "name");

  if (!candidates.length) return;

  const razorpay = getRazorpayClient();
  const refundAmountInPaise = Math.round(VERIFICATION_FEE_INR * 100 * (1 - REFUND_KEEP_PCT));

  for (const investment of candidates) {
    try {
      await razorpay.payments.refund(investment.verificationPaymentId, { amount: refundAmountInPaise });

      investment.refunded = true;
      investment.refundAmount = refundAmountInPaise / 100;
      investment.refundedAt = new Date();
      await investment.save();

      await notify(app, {
        user: investment.investor,
        type: "system",
        title: "Verification fee refunded",
        message: `The founder of ${investment.startup?.name ?? "the startup"} didn't respond within ${NO_RESPONSE_REFUND_DAYS} days, so ₹${investment.refundAmount} of your verification fee was refunded.`,
        link: `/startups/${investment.startup?._id}`,
      });
    } catch (err) {
      logger.error("Failed to auto-refund investment", { investmentId: investment._id.toString(), error: err.message });
    }
  }
}
