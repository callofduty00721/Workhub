import { Router } from "express";
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

const router = Router();

router.get("/", listStartups);
router.get("/mine", protect, authorize("founder", "super_admin"), getMyStartups);
router.get("/followed/mine", protect, getFollowedStartups);
router.get("/:id", optionalAuth, getStartupById);
router.post("/", protect, authorize("founder", "super_admin"), createStartup);
router.put("/:id", protect, updateStartup);
router.delete("/:id", protect, deleteStartup);
router.post("/:id/follow", protect, toggleFollow);
router.post("/:id/interest", protect, requireVerifiedForAction("contact_startup"), toggleInterest);
router.post("/:id/report", protect, reportStartup);
router.post("/:id/verification-requests", protect, submitVerificationRequest);

export default router;
