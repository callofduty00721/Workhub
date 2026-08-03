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
import { getPlatformSettings, updatePlatformSettings } from "./settings.js";
import { listPlans, updatePlan } from "./plans.js";
import { adminListSkillTests, createSkillTest, updateSkillTest, deleteSkillTest } from "../marketplace/skillTest.controller.js";
import { protect, authorize } from "../../middleware/auth.js";

const router = Router();

router.use(protect, authorize("super_admin"));

router.get("/stats", getStats);
router.get("/users", listUsers);
router.put("/users/:id/ban", toggleBanUser);
router.put("/users/:id/reactivate", reactivateUser);
router.put("/users/:id/delete", deleteUser);
router.put("/users/:id/role", updateUserRole);
router.get("/flagged-startups", getFlaggedStartups);
router.put("/flagged-startups/:id/resolve", resolveFlaggedStartup);
router.get("/startups", listAllStartups);
router.put("/startups/:id/verify-founder", toggleFounderVerified);
router.put("/startups/:id/verify-business", toggleBusinessVerified);
router.get("/verification-requests", listVerificationRequests);
router.put("/verification-requests/:startupId/:requestId", reviewVerificationRequest);

router.get("/services", listAllServices);
router.put("/services/:id/toggle-status", toggleServiceStatus);
router.delete("/services/:id", removeService);
router.get("/contests", listAllContests);
router.put("/contests/:id/close", closeContest);
router.delete("/contests/:id", removeContest);
router.get("/jobs", listAllJobs);
router.put("/jobs/:id/toggle-status", toggleJobStatus);
router.delete("/jobs/:id", removeJob);
router.get("/projects", listAllProjects);
router.put("/projects/:id/toggle-status", toggleProjectStatus);
router.delete("/projects/:id", removeProject);
router.get("/payments", listPayments);
router.put("/payments/:id/resolve-dispute", resolveDispute);
router.get("/withdrawals", listWithdrawals);
router.put("/withdrawals/:id/resolve", resolveWithdrawal);
router.get("/kyc-requests", listKycRequests);
router.put("/kyc-requests/:userId/review", reviewKyc);
router.get("/profile-verification-requests/:type", listProfileVerificationRequests);
router.put("/profile-verification-requests/:type/:userId/review", reviewProfileVerification);
router.get("/settings", getPlatformSettings);
router.put("/settings", updatePlatformSettings);
router.get("/plans", listPlans);
router.put("/plans/:id", updatePlan);
router.get("/skill-tests", adminListSkillTests);
router.post("/skill-tests", createSkillTest);
router.put("/skill-tests/:id", updateSkillTest);
router.delete("/skill-tests/:id", deleteSkillTest);

export default router;
