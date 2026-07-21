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
  listPayments,
  resolveDispute,
} from "../controllers/adminController.js";
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
router.get("/payments", listPayments);
router.put("/payments/:id/resolve-dispute", resolveDispute);

export default router;
