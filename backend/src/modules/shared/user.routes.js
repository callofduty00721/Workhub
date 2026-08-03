import { Router } from "express";
import {
  updateMyProfile,
  updateNotificationPreferences,
  submitKyc,
  sendPhoneOtp,
  verifyPhoneOtp,
  verifyPhoneFirebaseToken,
  submitFaceVerification,
  submitAddressVerification,
  submitBankVerification,
  toggleSavedJob,
  toggleSavedProject,
  toggleSavedService,
  toggleSavedFreelancer,
  toggleSavedContest,
  getSavedItems,
  getMyReferrals,
} from "./user.controller.js";
import { protect } from "../../middleware/auth.js";

const router = Router();

router.put("/me", protect, updateMyProfile);
router.put("/me/notification-preferences", protect, updateNotificationPreferences);
router.post("/me/kyc", protect, submitKyc);
router.post("/me/phone-otp", protect, sendPhoneOtp);
router.post("/me/phone-otp/verify", protect, verifyPhoneOtp);
router.post("/me/phone-otp/verify-firebase", protect, verifyPhoneFirebaseToken);
router.post("/me/face-verification", protect, submitFaceVerification);
router.post("/me/address-verification", protect, submitAddressVerification);
router.post("/me/bank-verification", protect, submitBankVerification);
router.get("/me/saved", protect, getSavedItems);
router.get("/me/referrals", protect, getMyReferrals);
router.put("/me/saved-jobs/:jobId", protect, toggleSavedJob);
router.put("/me/saved-projects/:projectId", protect, toggleSavedProject);
router.put("/me/saved-services/:serviceId", protect, toggleSavedService);
router.put("/me/saved-freelancers/:freelancerId", protect, toggleSavedFreelancer);
router.put("/me/saved-contests/:contestId", protect, toggleSavedContest);

export default router;
