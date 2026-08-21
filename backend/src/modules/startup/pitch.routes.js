import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { sendPitch, getSentPitches, getReceivedPitches, markPitchViewed } from "./pitch.controller.js";
import { protect, authorize } from "../../middleware/auth.js";
import { requireVerifiedForAction } from "../../middleware/roleAuth.js";
import { validate } from "../../middleware/validate.js";
import { sendPitchSchema } from "./pitch.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.post("/", protect, authorize("founder", "super_admin"), requireVerifiedForAction("pitch_investor"), validate(sendPitchSchema), sendPitch);
router.get("/sent", protect, authorize("founder", "super_admin"), getSentPitches);
router.get("/received", protect, authorize("investor", "super_admin"), getReceivedPitches);
router.put("/:id/viewed", protect, authorize("investor", "super_admin"), markPitchViewed);

export default router;
