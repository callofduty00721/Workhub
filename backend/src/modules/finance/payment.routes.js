import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import rateLimit from "express-rate-limit";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeCheckout,
  getMySubscription,
  getMySubscriptions,
  getSubscriptionById,
  downloadSubscriptionInvoice,
  emailSubscriptionInvoice,
} from "./subscription.controller.js";
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
import { RATE_LIMITS } from "../../config/rateLimits.js";
import { validate } from "../../middleware/validate.js";
import { checkoutSchema, verifyRazorpayPaymentSchema } from "./subscription.validation.js";
import { createGigOrderPaymentSchema, createHourlyPaymentSchema } from "./marketplaceOrders.validation.js";
import { deliverWorkSchema, requestRevisionSchema, requestExtensionSchema, respondExtensionSchema } from "./orderLifecycle.validation.js";
import { raiseDisputeSchema, requestWithdrawalSchema } from "./disputesWithdrawals.validation.js";

const router = Router();
router.param("applicationId", validateObjectId);
router.param("contestId", validateObjectId);
router.param("entryId", validateObjectId);
router.param("id", validateObjectId);
router.param("milestoneId", validateObjectId);
router.param("serviceId", validateObjectId);

router.use(protect);

// Every route below moves money or confirms a payment signature — the
// app-wide tiered limiter (tieredRateLimit.js) is far too loose to catch
// someone hammering /razorpay/verify or /marketplace/verify trying to guess
// a valid signature. Keyed per-user (protect has already run, so req.user
// exists) rather than per-IP, so one office/NAT full of legitimate users
// can't lock each other out.
router.use(
  rateLimit({
    windowMs: RATE_LIMITS.payment.windowMs,
    limit: RATE_LIMITS.payment.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?._id?.toString() ?? req.ip,
    message: { success: false, message: "Too many payment requests — please slow down and try again shortly." },
    store: createRateLimitStore(RATE_LIMITS.payment.windowMs, "payment"),
  })
);

router.post("/razorpay/order", validate(checkoutSchema), createRazorpayOrder);
router.post("/razorpay/verify", validate(verifyRazorpayPaymentSchema), verifyRazorpayPayment);
router.post("/stripe/checkout", validate(checkoutSchema), createStripeCheckout);
router.get("/subscription", getMySubscription);
router.get("/subscriptions/mine", getMySubscriptions);
router.get("/subscriptions/:id", getSubscriptionById);
router.get("/subscriptions/:id/invoice", downloadSubscriptionInvoice);
router.post("/subscriptions/:id/invoice/email", emailSubscriptionInvoice);

router.post("/gig-order/:serviceId", validate(createGigOrderPaymentSchema), createGigOrderPayment);
router.post("/job-hire/:applicationId", createJobHirePayment);
router.post("/campaign/:applicationId", createCampaignPayment);
router.post("/campaign-offplatform/:applicationId", createOffPlatformFacilitationPayment);
router.post("/milestone/:milestoneId", createMilestonePayment);
router.post("/hourly/:applicationId", validate(createHourlyPaymentSchema), createHourlyPayment);
router.post("/contest-prize/:contestId/:entryId", createContestPrizePayment);
router.post("/marketplace/verify", validate(verifyRazorpayPaymentSchema), verifyMarketplacePayment);
router.put("/:id/release", releasePayment);
router.put("/:id/deliver", validate(deliverWorkSchema), deliverWork);
router.put("/:id/accept-delivery", acceptDelivery);
router.put("/:id/request-revision", validate(requestRevisionSchema), requestRevision);
router.put("/:id/request-extension", validate(requestExtensionSchema), requestExtension);
router.put("/:id/respond-extension", validate(respondExtensionSchema), respondExtension);
router.get("/earnings/mine", getMyEarnings);
router.get("/mine", getMyPayments);
router.post("/:id/dispute", validate(raiseDisputeSchema), raiseDispute);
router.post("/withdrawals", validate(requestWithdrawalSchema), requestWithdrawal);
router.get("/withdrawals/mine", getMyWithdrawals);
router.get("/:id/invoice", downloadInvoice);
// Kept last: a bare "/:id" would otherwise swallow the literal GET routes above
// (e.g. "/mine" would bind to :id) since Express matches in registration order.
router.get("/:id", getPaymentById);

export default router;
