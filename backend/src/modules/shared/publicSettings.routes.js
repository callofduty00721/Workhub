import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { getPhoneAuthProvider } from "../finance/platformSettings.model.js";

const router = Router();

// Not admin-gated — any logged-in user needs to know which phone-verification
// UI to render (Firebase's client SDK flow vs Twilio's send/check-code flow,
// or neither if disabled). Nothing sensitive in the response, just a label.
router.get(
  "/phone-auth-provider",
  asyncHandler(async (req, res) => {
    const provider = await getPhoneAuthProvider();
    res.json({ success: true, data: { provider } });
  })
);

export default router;
