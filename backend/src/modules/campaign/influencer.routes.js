import { Router } from "express";
import { listInfluencers, getInfluencerProfile, getMyProfileViewTrend } from "./influencer.controller.js";
import { protect, optionalAuth } from "../../middleware/auth.js";

const router = Router();

router.get("/", listInfluencers);
router.get("/me/view-trend", protect, getMyProfileViewTrend);
router.get("/:id", optionalAuth, getInfluencerProfile);

export default router;
