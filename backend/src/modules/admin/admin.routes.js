import { Router } from "express";
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
import { listAllJobs, toggleJobStatus, removeJob } from "./jobs.js";
import { listAllProjects, toggleProjectStatus, removeProject } from "./projects.js";
import { listPayments, resolveDispute } from "./payments.js";
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
import { adminListSkillTests, createSkillTest, updateSkillTest, deleteSkillTest } from "../marketplace/skillTest.controller.js";
import { protect, authorize, requirePermission } from "../../middleware/auth.js";

const router = Router();

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
router.put("/users/:id/role", authorize("super_admin"), updateUserRole);

router.get("/staff", authorize("super_admin"), listStaff);
router.post("/staff", authorize("super_admin"), createStaff);
router.put("/staff/:id/permissions", authorize("super_admin"), updateStaffPermissions);
router.get("/activity", authorize("super_admin"), listActivity);

router.get("/flagged-startups", requirePermission("flagged-startups"), getFlaggedStartups);
router.put("/flagged-startups/:id/resolve", requirePermission("flagged-startups"), resolveFlaggedStartup);
router.get("/startups", requirePermission("startups"), listAllStartups);
router.put("/startups/:id/verify-founder", requirePermission("startups"), toggleFounderVerified);
router.put("/startups/:id/verify-business", requirePermission("startups"), toggleBusinessVerified);
router.get("/verification-requests", requirePermission("startups"), listVerificationRequests);
router.put("/verification-requests/:startupId/:requestId", requirePermission("startups"), reviewVerificationRequest);

router.get("/services", requirePermission("gigs"), listAllServices);
router.put("/services/:id/toggle-status", requirePermission("gigs"), toggleServiceStatus);
router.delete("/services/:id", requirePermission("gigs"), removeService);
router.get("/contests", requirePermission("contests"), listAllContests);
router.put("/contests/:id/close", requirePermission("contests"), closeContest);
router.delete("/contests/:id", requirePermission("contests"), removeContest);
router.get("/jobs", requirePermission("jobs"), listAllJobs);
router.put("/jobs/:id/toggle-status", requirePermission("jobs"), toggleJobStatus);
router.delete("/jobs/:id", requirePermission("jobs"), removeJob);
router.get("/projects", requirePermission("jobs"), listAllProjects);
router.put("/projects/:id/toggle-status", requirePermission("jobs"), toggleProjectStatus);
router.delete("/projects/:id", requirePermission("jobs"), removeProject);

router.get("/payments", authorize("super_admin"), listPayments);
router.put("/payments/:id/resolve-dispute", authorize("super_admin"), resolveDispute);
router.get("/withdrawals", authorize("super_admin"), listWithdrawals);
router.put("/withdrawals/:id/resolve", authorize("super_admin"), resolveWithdrawal);

router.get("/kyc-requests", requirePermission("kyc"), listKycRequests);
router.put("/kyc-requests/:userId/review", requirePermission("kyc"), reviewKyc);
router.get("/profile-verification-requests/:type", requirePermission("profile-verifications"), listProfileVerificationRequests);
router.put("/profile-verification-requests/:type/:userId/review", requirePermission("profile-verifications"), reviewProfileVerification);
router.get("/grievances", requirePermission("grievances"), listGrievances);
router.put("/grievances/:id", requirePermission("grievances"), updateGrievanceStatus);

router.get("/settings", authorize("super_admin"), getPlatformSettings);
router.put("/settings", authorize("super_admin"), updatePlatformSettings);
router.get("/plans", authorize("super_admin"), listPlans);
router.put("/plans/:id", authorize("super_admin"), updatePlan);

router.get("/skill-tests", requirePermission("skill-tests"), adminListSkillTests);
router.post("/skill-tests", requirePermission("skill-tests"), createSkillTest);
router.put("/skill-tests/:id", requirePermission("skill-tests"), updateSkillTest);
router.delete("/skill-tests/:id", requirePermission("skill-tests"), deleteSkillTest);

export default router;
