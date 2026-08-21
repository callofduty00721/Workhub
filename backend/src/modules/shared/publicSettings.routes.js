import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { getPhoneAuthProvider, getJobsEnabled, getCommissionPercent } from "../finance/platformSettings.model.js";
import { isRazorpayConfigured, isStripeConfigured } from "../../config/payments.js";

const router = Router();
router.param("id", validateObjectId);

// Not admin-gated — any logged-in user needs to know whether to render
// Firebase's client SDK phone-verification flow, or neither if disabled.
// Nothing sensitive in the response, just a label.
router.get(
  "/phone-auth-provider",
  asyncHandler(async (req, res) => {
    const provider = await getPhoneAuthProvider();
    res.json({ success: true, data: { provider } });
  })
);

// Not admin-gated — public (even logged-out) visitors need this to decide
// whether to render the "Jobs" nav link and the /jobs, /jobs/:id routes.
router.get(
  "/jobs-enabled",
  asyncHandler(async (req, res) => {
    const enabled = await getJobsEnabled();
    res.json({ success: true, data: { enabled } });
  })
);

// Not admin-gated — the Pricing page needs this to decide which checkout
// buttons to actually show. Just a boolean per gateway (env vars present or
// not), never the keys themselves — showing a "Pay with Stripe" button that
// 503s on click because no one's set STRIPE_SECRET_KEY yet is worse than not
// showing it at all.
router.get(
  "/payment-gateways",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: { razorpay: isRazorpayConfigured(), stripe: isStripeConfigured() } });
  })
);

// Not admin-gated — a brand needs to know the fee upfront before confirming
// an off-platform settlement (see CampaignApplicants.tsx's warning dialog),
// not just after the Razorpay checkout opens.
router.get(
  "/commission-percent",
  asyncHandler(async (req, res) => {
    const commissionPercent = await getCommissionPercent();
    res.json({ success: true, data: { commissionPercent } });
  })
);

export default router;
