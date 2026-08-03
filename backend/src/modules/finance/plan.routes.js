import { Router } from "express";
import Plan from "./plan.model.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

const router = Router();

// Public — anyone (including logged-out visitors on the Pricing page) can
// browse plans. Admin-only editing lives under /admin/plans instead.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = req.query.role ? { role: req.query.role } : {};
    const plans = await Plan.find(filter).sort({ role: 1, tier: 1 });
    res.json({ success: true, data: plans });
  })
);

export default router;
