import { Router } from "express";
import {
  listCampaigns,
  getMyCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  applyToCampaign,
  getCampaignApplications,
} from "./campaign.controller.js";
import { protect, optionalAuth, authorize } from "../../middleware/auth.js";
import { requireVerifiedForAction } from "../../middleware/roleAuth.js";

const router = Router();

router.get("/", listCampaigns);
router.get("/mine", protect, authorize("employer", "client", "super_admin"), getMyCampaigns);
router.get("/:id", optionalAuth, getCampaignById);
router.post("/", protect, authorize("employer", "client", "super_admin"), requireVerifiedForAction("post_campaign"), createCampaign);
router.put("/:id", protect, updateCampaign);
router.delete("/:id", protect, deleteCampaign);

router.post("/:id/apply", protect, authorize("influencer", "super_admin"), applyToCampaign);
router.get("/:id/applications", protect, authorize("employer", "client", "super_admin"), getCampaignApplications);

export default router;
