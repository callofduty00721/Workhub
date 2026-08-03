import { Router } from "express";
import { listFounders, getFounderProfile, toggleFollowFounder } from "./founder.controller.js";
import { protect, optionalAuth } from "../../middleware/auth.js";

const router = Router();

router.get("/", listFounders);
router.get("/:id", optionalAuth, getFounderProfile);
router.post("/:id/follow", protect, toggleFollowFounder);

export default router;
