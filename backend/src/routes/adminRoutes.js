import { Router } from "express";
import {
  getStats,
  listUsers,
  toggleBanUser,
  updateUserRole,
  getFlaggedStartups,
  resolveFlaggedStartup,
  listAllStartups,
  toggleFounderVerified,
  toggleBusinessVerified,
  listVerificationRequests,
  reviewVerificationRequest,
  listAllServices,
  toggleServiceStatus,
  removeService,
  listAllContests,
  closeContest,
  removeContest,
  listAllJobs,
  toggleJobStatus,
  removeJob,
  listAllProjects,
  toggleProjectStatus,
  removeProject,
  listPayments,
  resolveDispute,
  listWithdrawals,
  resolveWithdrawal,
  listKycRequests,
  reviewKyc,
  getPlatformSettings,
  updatePlatformSettings,
} from "../controllers/adminController.js";
import { adminListSkillTests, createSkillTest, updateSkillTest, deleteSkillTest } from "../controllers/skillTestController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("super_admin"));

router.get("/stats", getStats);
router.get("/users", listUsers);
router.put("/users/:id/ban", toggleBanUser);
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
router.get("/settings", getPlatformSettings);
router.put("/settings", updatePlatformSettings);
router.get("/skill-tests", adminListSkillTests);
router.post("/skill-tests", createSkillTest);
router.put("/skill-tests/:id", updateSkillTest);
router.delete("/skill-tests/:id", deleteSkillTest);

export default router;
