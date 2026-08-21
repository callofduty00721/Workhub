import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { inviteToRoster, respondToInvite, listMyRoster, listPendingInvites, removeFromRoster, getPublicRoster } from "./talentRoster.controller.js";
import { protect, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { inviteToRosterSchema, respondToInviteSchema } from "./talentRoster.validation.js";

const router = Router();
router.param("id", validateObjectId);
router.param("partnerId", validateObjectId);

router.get("/public/:partnerId", getPublicRoster);

router.post("/invite", protect, authorize("agency", "talent_partner", "super_admin"), validate(inviteToRosterSchema), inviteToRoster);
router.get("/mine", protect, authorize("agency", "talent_partner", "super_admin"), listMyRoster);
router.delete("/:id", protect, authorize("agency", "talent_partner", "super_admin"), removeFromRoster);

router.get("/pending", protect, authorize("influencer", "super_admin"), listPendingInvites);
router.post("/:id/respond", protect, authorize("influencer", "super_admin"), validate(respondToInviteSchema), respondToInvite);

export default router;
