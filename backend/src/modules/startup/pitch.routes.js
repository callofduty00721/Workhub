import { Router } from "express";
import { sendPitch, getSentPitches, getReceivedPitches, markPitchViewed } from "./pitch.controller.js";
import { protect, authorize } from "../../middleware/auth.js";
import { requireVerifiedForAction } from "../../middleware/roleAuth.js";

const router = Router();

router.post("/", protect, authorize("founder", "super_admin"), requireVerifiedForAction("pitch_investor"), sendPitch);
router.get("/sent", protect, authorize("founder", "super_admin"), getSentPitches);
router.get("/received", protect, authorize("investor", "super_admin"), getReceivedPitches);
router.put("/:id/viewed", protect, authorize("investor", "super_admin"), markPitchViewed);

export default router;
