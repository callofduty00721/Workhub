import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { getStats } from "./stats.js";
import { listUsers, toggleBanUser, reactivateUser, deleteUser, updateUserRole } from "./users.js";
import {
  getFlaggedStartups,
  resolveFlaggedStartup,
  listAllStartups,
  toggleFounderVerified,
  toggleBusinessVerified,
  listVerificationRequests,
  reviewVerificationRequest,
} from "./startups.js";
import { listAllServices, toggleServiceStatus, removeService } from "./services.js";
import { listAllContests, closeContest, removeContest } from "./contests.js";
import { listAllJobs, toggleJobStatus, removeJob, dismissJobReports } from "./jobs.js";
import { listAllProjects, toggleProjectStatus, removeProject } from "./projects.js";
import { listPayments, resolveDispute } from "./payments.js";
import { listSubscriptions, getSubscriptionStats } from "./subscriptions.js";
import { listReviews } from "./reviews.js";
import { getReferralStats, listTopReferrers } from "./referrals.js";
import { listAllCampaigns, toggleCampaignStatus, removeCampaign } from "./campaigns.js";
import { sendAnnouncement, listAnnouncements } from "./announcements.js";
import { listWithdrawals, resolveWithdrawal } from "./withdrawals.js";
import {
  listKycRequests,
  reviewKyc,
  listProfileVerificationRequests,
  reviewProfileVerification,
} from "./kyc.js";
import { listGrievances, updateGrievanceStatus } from "./grievances.js";
import { getPlatformSettings, updatePlatformSettings } from "./settings.js";
import { listPlans, updatePlan } from "./plans.js";
import { listStaff, createStaff, updateStaffPermissions } from "./staff.js";
import { listActivity } from "./activity.js";
import { listSecurityEvents } from "./securityEvents.js";
import { downloadVerificationHistory } from "./verificationHistory.js";
import { adminListSkillTests, createSkillTest, updateSkillTest, deleteSkillTest } from "../marketplace/skillTest.controller.js";
import { protect, authorize, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createSkillTestSchema, updateSkillTestSchema } from "../marketplace/skillTest.validation.js";
import {
  updateUserRoleSchema,
  resolveFlaggedStartupSchema,
  reviewVerificationRequestSchema,
  resolveDisputeSchema,
  resolveWithdrawalSchema,
  reviewKycSchema,
  reviewProfileVerificationSchema,
  updateGrievanceStatusSchema,
  updatePlatformSettingsSchema,
  updatePlanSchema,
  createStaffSchema,
  updateStaffPermissionsSchema,
  listSecurityEventsQuerySchema,
  sendAnnouncementSchema,
} from "./admin.validation.js";

const router = Router();
router.param("id", validateObjectId);
router.param("requestId", validateObjectId);
router.param("startupId", validateObjectId);
router.param("userId", validateObjectId);

// A "staff" account only gets past this gate at all if it's going to hit a
// route below that checks requirePermission(...) — every route without one
// has an explicit authorize("super_admin") of its own instead, so staff
// never reaches it regardless of what's in staffPermissions.
router.use(protect, authorize("super_admin", "staff"));

router.get("/stats", getStats);

router.get("/users", authorize("super_admin"), listUsers);
router.put("/users/:id/ban", authorize("super_admin"), toggleBanUser);
router.put("/users/:id/reactivate", authorize("super_admin"), reactivateUser);
router.put("/users/:id/delete", authorize("super_admin"), deleteUser);
router.put("/users/:id/role", authorize("super_admin"), validate(updateUserRoleSchema), updateUserRole);

router.get("/staff", authorize("super_admin"), listStaff);
router.post("/staff", authorize("super_admin"), validate(createStaffSchema), createStaff);
router.put("/staff/:id/permissions", authorize("super_admin"), validate(updateStaffPermissionsSchema), updateStaffPermissions);
router.get("/activity", authorize("super_admin"), listActivity);
router.get("/security-events", authorize("super_admin"), validate(listSecurityEventsQuerySchema, "query"), listSecurityEvents);

router.get("/flagged-startups", requirePermission("flagged-startups"), getFlaggedStartups);
router.put("/flagged-startups/:id/resolve", requirePermission("flagged-startups"), validate(resolveFlaggedStartupSchema), resolveFlaggedStartup);
router.get("/startups", requirePermission("startups"), listAllStartups);
router.put("/startups/:id/verify-founder", requirePermission("startups"), toggleFounderVerified);
router.put("/startups/:id/verify-business", requirePermission("startups"), toggleBusinessVerified);
router.get("/verification-requests", requirePermission("startups"), listVerificationRequests);
router.put(
  "/verification-requests/:startupId/:requestId",
  requirePermission("startups"),
  validate(reviewVerificationRequestSchema),
  reviewVerificationRequest
);

router.get("/services", requirePermission("gigs"), listAllServices);
router.put("/services/:id/toggle-status", requirePermission("gigs"), toggleServiceStatus);
router.delete("/services/:id", requirePermission("gigs"), removeService);
router.get("/contests", requirePermission("contests"), listAllContests);
router.put("/contests/:id/close", requirePermission("contests"), closeContest);
router.delete("/contests/:id", requirePermission("contests"), removeContest);
router.get("/jobs", requirePermission("jobs"), listAllJobs);
router.put("/jobs/:id/toggle-status", requirePermission("jobs"), toggleJobStatus);
router.put("/jobs/:id/dismiss-reports", requirePermission("jobs"), dismissJobReports);
router.delete("/jobs/:id", requirePermission("jobs"), removeJob);
router.get("/projects", requirePermission("jobs"), listAllProjects);
router.put("/projects/:id/toggle-status", requirePermission("jobs"), toggleProjectStatus);
router.delete("/projects/:id", requirePermission("jobs"), removeProject);

router.get("/payments", authorize("super_admin"), listPayments);
router.put("/payments/:id/resolve-dispute", authorize("super_admin"), validate(resolveDisputeSchema), resolveDispute);
router.get("/withdrawals", authorize("super_admin"), listWithdrawals);
router.put("/withdrawals/:id/resolve", authorize("super_admin"), validate(resolveWithdrawalSchema), resolveWithdrawal);

router.get("/kyc-requests", requirePermission("kyc"), listKycRequests);
router.put("/kyc-requests/:userId/review", requirePermission("kyc"), validate(reviewKycSchema), reviewKyc);
router.get("/profile-verification-requests/:type", requirePermission("profile-verifications"), listProfileVerificationRequests);
router.put(
  "/profile-verification-requests/:type/:userId/review",
  requirePermission("profile-verifications"),
  validate(reviewProfileVerificationSchema),
  reviewProfileVerification
);
router.get("/users/:userId/verification-history.pdf", authorize("super_admin"), downloadVerificationHistory);
router.get("/grievances", requirePermission("grievances"), listGrievances);
router.put("/grievances/:id", requirePermission("grievances"), validate(updateGrievanceStatusSchema), updateGrievanceStatus);

router.get("/settings", authorize("super_admin"), getPlatformSettings);
router.put("/settings", authorize("super_admin"), validate(updatePlatformSettingsSchema), updatePlatformSettings);
router.get("/plans", authorize("super_admin"), listPlans);
router.put("/plans/:id", authorize("super_admin"), validate(updatePlanSchema), updatePlan);
router.get("/subscriptions/stats", authorize("super_admin"), getSubscriptionStats);
router.get("/subscriptions", authorize("super_admin"), listSubscriptions);
router.get("/reviews", requirePermission("reviews"), listReviews);
router.get("/referrals/stats", requirePermission("referrals"), getReferralStats);
router.get("/referrals", requirePermission("referrals"), listTopReferrers);

router.get("/campaigns", requirePermission("campaigns"), listAllCampaigns);
router.put("/campaigns/:id/toggle-status", requirePermission("campaigns"), toggleCampaignStatus);
router.delete("/campaigns/:id", requirePermission("campaigns"), removeCampaign);

// Platform-wide messaging is squarely in the same "too consequential to
// delegate" bucket as Users/Settings/Payments — super_admin only, not
// staff-delegable via requirePermission.
router.post("/announcements", authorize("super_admin"), validate(sendAnnouncementSchema), sendAnnouncement);
router.get("/announcements", authorize("super_admin"), listAnnouncements);

router.get("/skill-tests", requirePermission("skill-tests"), adminListSkillTests);
router.post("/skill-tests", requirePermission("skill-tests"), validate(createSkillTestSchema), createSkillTest);
router.put("/skill-tests/:id", requirePermission("skill-tests"), validate(updateSkillTestSchema), updateSkillTest);
router.delete("/skill-tests/:id", requirePermission("skill-tests"), deleteSkillTest);

export default router;
