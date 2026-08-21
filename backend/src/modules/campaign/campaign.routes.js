import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import {
  listCampaigns,
  getMyCampaigns,
  getMyCampaignAnalytics,
  getCampaignsOnBehalfOfMe,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  applyToCampaign,
  inviteToCampaign,
  getCampaignApplications,
  getCampaignReport,
  toggleCampaignFeatured,
} from "./campaign.controller.js";
import { protect, optionalAuth, authorize } from "../../middleware/auth.js";
import { requireVerifiedForAction } from "../../middleware/roleAuth.js";
import { validate } from "../../middleware/validate.js";
import {
  createCampaignSchema,
  updateCampaignSchema,
  applyToCampaignSchema,
  inviteToCampaignSchema,
  listCampaignsQuerySchema,
} from "./campaign.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.get("/", validate(listCampaignsQuerySchema, "query"), listCampaigns);
router.get("/mine", protect, authorize("employer", "client", "brand", "agency", "talent_partner", "super_admin"), getMyCampaigns);
router.get("/analytics/mine", protect, authorize("employer", "client", "brand", "agency", "talent_partner", "super_admin"), getMyCampaignAnalytics);
router.get("/on-behalf-of-me", protect, authorize("brand", "employer", "client", "super_admin"), getCampaignsOnBehalfOfMe);
router.get("/:id", optionalAuth, getCampaignById);
router.post(
  "/",
  protect,
  authorize("employer", "client", "brand", "agency", "talent_partner", "super_admin"),
  requireVerifiedForAction("post_campaign"),
  validate(createCampaignSchema),
  createCampaign
);
router.put("/:id", protect, validate(updateCampaignSchema), updateCampaign);
router.delete("/:id", protect, deleteCampaign);

router.post("/:id/apply", protect, authorize("influencer", "super_admin"), validate(applyToCampaignSchema), applyToCampaign);
router.post(
  "/:id/invite",
  protect,
  authorize("employer", "client", "brand", "agency", "talent_partner", "super_admin"),
  validate(inviteToCampaignSchema),
  inviteToCampaign
);
router.get("/:id/applications", protect, authorize("employer", "client", "brand", "agency", "talent_partner", "super_admin"), getCampaignApplications);
router.get("/:id/report", protect, getCampaignReport);
router.put("/:id/feature", protect, authorize("super_admin"), toggleCampaignFeatured);

export default router;
