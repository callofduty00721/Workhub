import { Router } from "express";
import {
  updateMyProfile,
  updateNotificationPreferences,
  submitKyc,
  toggleSavedJob,
  toggleSavedProject,
  toggleSavedService,
  getSavedItems,
  getMyReferrals,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.put("/me", protect, updateMyProfile);
router.put("/me/notification-preferences", protect, updateNotificationPreferences);
router.post("/me/kyc", protect, submitKyc);
router.get("/me/saved", protect, getSavedItems);
router.get("/me/referrals", protect, getMyReferrals);
router.put("/me/saved-jobs/:jobId", protect, toggleSavedJob);
router.put("/me/saved-projects/:projectId", protect, toggleSavedProject);
router.put("/me/saved-services/:serviceId", protect, toggleSavedService);

export default router;
