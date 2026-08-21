import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import {
  updateMyProfile,
  updateNotificationPreferences,
  submitKyc,
  verifyPhoneFirebaseToken,
  submitFaceVerification,
  submitAddressVerification,
  submitBankVerification,
  toggleSavedJob,
  toggleSavedProject,
  toggleSavedService,
  toggleSavedFreelancer,
  toggleSavedContest,
  toggleSavedInfluencer,
  toggleSavedCampaign,
  toggleSavedInvestor,
  toggleSavedMentor,
  toggleSavedPartner,
  getSavedItems,
  getMyReferrals,
} from "./user.controller.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { updateMyProfileSchema } from "./user.validation.js";

const router = Router();
router.param("campaignId", validateObjectId);
router.param("contestId", validateObjectId);
router.param("freelancerId", validateObjectId);
router.param("influencerId", validateObjectId);
router.param("investorId", validateObjectId);
router.param("mentorId", validateObjectId);
router.param("partnerId", validateObjectId);
router.param("jobId", validateObjectId);
router.param("projectId", validateObjectId);
router.param("serviceId", validateObjectId);

router.put("/me", protect, validate(updateMyProfileSchema), updateMyProfile);
router.put("/me/notification-preferences", protect, updateNotificationPreferences);
router.post("/me/kyc", protect, submitKyc);
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
router.put("/me/saved-influencers/:influencerId", protect, toggleSavedInfluencer);
router.put("/me/saved-campaigns/:campaignId", protect, toggleSavedCampaign);
router.put("/me/saved-investors/:investorId", protect, toggleSavedInvestor);
router.put("/me/saved-mentors/:mentorId", protect, toggleSavedMentor);
router.put("/me/saved-partners/:partnerId", protect, toggleSavedPartner);

export default router;
