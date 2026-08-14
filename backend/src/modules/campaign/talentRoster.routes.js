import { Router } from "express";
import { inviteToRoster, respondToInvite, listMyRoster, listPendingInvites, removeFromRoster, getPublicRoster } from "./talentRoster.controller.js";
import { protect, authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/public/:partnerId", getPublicRoster);

router.post("/invite", protect, authorize("agency", "talent_partner", "super_admin"), inviteToRoster);
router.get("/mine", protect, authorize("agency", "talent_partner", "super_admin"), listMyRoster);
router.delete("/:id", protect, authorize("agency", "talent_partner", "super_admin"), removeFromRoster);

router.get("/pending", protect, authorize("influencer", "super_admin"), listPendingInvites);
router.post("/:id/respond", protect, authorize("influencer", "super_admin"), respondToInvite);

export default router;
