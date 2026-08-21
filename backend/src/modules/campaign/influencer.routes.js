import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { listInfluencers, getInfluencerProfile, getMyProfileViewTrend } from "./influencer.controller.js";
import { protect, optionalAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { listInfluencersQuerySchema } from "./influencer.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.get("/", validate(listInfluencersQuerySchema, "query"), listInfluencers);
router.get("/me/view-trend", protect, getMyProfileViewTrend);
router.get("/:id", optionalAuth, getInfluencerProfile);

export default router;
