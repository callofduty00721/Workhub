import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createRazorpayOrder, verifyRazorpayPayment, createStripeCheckout, getMySubscription } from "./subscription.controller.js";
import {
  createGigOrderPayment,
  createJobHirePayment,
  createCampaignPayment,
  createOffPlatformFacilitationPayment,
  createMilestonePayment,
  createHourlyPayment,
  createContestPrizePayment,
} from "./marketplaceOrders.controller.js";
import { verifyMarketplacePayment } from "./webhooks.controller.js";
import {
  releasePayment,
  deliverWork,
  acceptDelivery,
  requestRevision,
  requestExtension,
  respondExtension,
} from "./orderLifecycle.controller.js";
import { getPaymentById, downloadInvoice, getMyEarnings, getMyPayments } from "./earnings.controller.js";
import { raiseDispute, requestWithdrawal, getMyWithdrawals } from "./disputesWithdrawals.controller.js";
import { protect } from "../../middleware/auth.js";
import { createRateLimitStore } from "../../utils/rateLimitStore.js";

const router = Router();

router.use(protect);

// Every route below moves money or confirms a payment signature — the app-wide
// global limiter (300 req/15min, shared across every endpoint) is far too
// loose to catch someone hammering /razorpay/verify or /marketplace/verify
// trying to guess a valid signature. Keyed per-user (protect has already run,
// so req.user exists) rather than per-IP, so one office/NAT full of
// legitimate users can't lock each other out.
const PAYMENT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
router.use(
  rateLimit({
    windowMs: PAYMENT_RATE_LIMIT_WINDOW_MS,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?._id?.toString() ?? req.ip,
    message: { success: false, message: "Too many payment requests — please slow down and try again shortly." },
    store: createRateLimitStore(PAYMENT_RATE_LIMIT_WINDOW_MS, "payment"),
  })
);

router.post("/razorpay/order", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpayPayment);
router.post("/stripe/checkout", createStripeCheckout);
router.get("/subscription", getMySubscription);

router.post("/gig-order/:serviceId", createGigOrderPayment);
router.post("/job-hire/:applicationId", createJobHirePayment);
router.post("/campaign/:applicationId", createCampaignPayment);
router.post("/campaign-offplatform/:applicationId", createOffPlatformFacilitationPayment);
router.post("/milestone/:milestoneId", createMilestonePayment);
router.post("/hourly/:applicationId", createHourlyPayment);
router.post("/contest-prize/:contestId/:entryId", createContestPrizePayment);
router.post("/marketplace/verify", verifyMarketplacePayment);
router.put("/:id/release", releasePayment);
router.put("/:id/deliver", deliverWork);
router.put("/:id/accept-delivery", acceptDelivery);
router.put("/:id/request-revision", requestRevision);
router.put("/:id/request-extension", requestExtension);
router.put("/:id/respond-extension", respondExtension);
router.get("/earnings/mine", getMyEarnings);
router.get("/mine", getMyPayments);
router.post("/:id/dispute", raiseDispute);
router.post("/withdrawals", requestWithdrawal);
router.get("/withdrawals/mine", getMyWithdrawals);
router.get("/:id/invoice", downloadInvoice);
// Kept last: a bare "/:id" would otherwise swallow the literal GET routes above
// (e.g. "/mine" would bind to :id) since Express matches in registration order.
router.get("/:id", getPaymentById);

export default router;
