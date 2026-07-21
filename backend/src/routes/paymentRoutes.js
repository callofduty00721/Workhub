import { Router } from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeCheckout,
  getMySubscription,
  createGigOrderPayment,
  createJobHirePayment,
  createContestPrizePayment,
  verifyMarketplacePayment,
  getMyEarnings,
  getMyPayments,
  raiseDispute,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.post("/razorpay/order", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpayPayment);
router.post("/stripe/checkout", createStripeCheckout);
router.get("/subscription", getMySubscription);

router.post("/gig-order/:serviceId", createGigOrderPayment);
router.post("/job-hire/:applicationId", createJobHirePayment);
router.post("/contest-prize/:contestId/:entryId", createContestPrizePayment);
router.post("/marketplace/verify", verifyMarketplacePayment);
router.get("/earnings/mine", getMyEarnings);
router.get("/mine", getMyPayments);
router.post("/:id/dispute", raiseDispute);

export default router;
