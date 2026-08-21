import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import {
  listStartups,
  getMyStartups,
  getFollowedStartups,
  getStartupById,
  createStartup,
  updateStartup,
  deleteStartup,
  toggleFollow,
  toggleInterest,
  reportStartup,
  submitVerificationRequest,
} from "./startup.controller.js";
import { protect, authorize, optionalAuth } from "../../middleware/auth.js";
import { requireVerifiedForAction } from "../../middleware/roleAuth.js";
import { validate } from "../../middleware/validate.js";
import {
  createStartupSchema,
  updateStartupSchema,
  submitVerificationRequestSchema,
  reportStartupSchema,
  listStartupsQuerySchema,
} from "./startup.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.get("/", validate(listStartupsQuerySchema, "query"), listStartups);
router.get("/mine", protect, authorize("founder", "super_admin"), getMyStartups);
router.get("/followed/mine", protect, getFollowedStartups);
router.get("/:id", optionalAuth, getStartupById);
router.post("/", protect, authorize("founder", "super_admin"), validate(createStartupSchema), createStartup);
router.put("/:id", protect, validate(updateStartupSchema), updateStartup);
router.delete("/:id", protect, deleteStartup);
router.post("/:id/follow", protect, toggleFollow);
router.post("/:id/interest", protect, requireVerifiedForAction("contact_startup"), toggleInterest);
router.post("/:id/report", protect, validate(reportStartupSchema), reportStartup);
router.post("/:id/verification-requests", protect, validate(submitVerificationRequestSchema), submitVerificationRequest);

export default router;
