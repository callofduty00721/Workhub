import { Router } from "express";
import { createRazorpayOrder, verifyRazorpayPayment, createStripeCheckout, getMySubscription } from "./subscription.controller.js";
import {
  createGigOrderPayment,
  createJobHirePayment,
  createCampaignPayment,
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

const router = Router();

router.use(protect);

router.post("/razorpay/order", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpayPayment);
router.post("/stripe/checkout", createStripeCheckout);
router.get("/subscription", getMySubscription);

router.post("/gig-order/:serviceId", createGigOrderPayment);
router.post("/job-hire/:applicationId", createJobHirePayment);
router.post("/campaign/:applicationId", createCampaignPayment);
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
