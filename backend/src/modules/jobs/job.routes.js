import { Router } from "express";
import {
  listJobs,
  getJobCategoryCounts,
  getMyJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyToJob,
  getJobApplications,
  updateApplicationStatus,
  scheduleInterview,
  confirmInterview,
  getMyJobAnalytics,
  getInvitedJobs,
  inviteFreelancer,
  revokeInvite,
  acceptNda,
  getAttachmentUrl,
  getJobAccessLog,
} from "./job.controller.js";
import { protect, optionalAuth, authorize } from "../../middleware/auth.js";
import { requireVerifiedForAction } from "../../middleware/roleAuth.js";

const router = Router();

router.get("/", listJobs);
router.get("/category-counts", getJobCategoryCounts);
router.get("/mine", protect, authorize("employer", "client", "super_admin"), getMyJobs);
router.get("/invited", protect, authorize("freelancer", "super_admin"), getInvitedJobs);
router.get("/analytics/mine", protect, authorize("employer", "client", "super_admin"), getMyJobAnalytics);
router.get("/:id", optionalAuth, getJobById);
router.post("/", protect, authorize("employer", "client", "super_admin"), requireVerifiedForAction("post_job"), createJob);
router.put("/:id", protect, updateJob);
router.delete("/:id", protect, deleteJob);

router.post("/:id/apply", protect, authorize("freelancer", "job_seeker", "super_admin"), applyToJob);
router.get("/:id/applications", protect, authorize("employer", "client", "super_admin"), getJobApplications);
router.put("/applications/:id/status", protect, authorize("employer", "client", "super_admin"), updateApplicationStatus);
router.put("/applications/:id/schedule-interview", protect, authorize("employer", "client", "super_admin"), scheduleInterview);
router.put("/applications/:id/confirm-interview", protect, authorize("freelancer", "job_seeker", "super_admin"), confirmInterview);

router.put("/:id/invite", protect, authorize("employer", "client", "super_admin"), inviteFreelancer);
router.delete("/:id/invite/:freelancerId", protect, authorize("employer", "client", "super_admin"), revokeInvite);
router.post("/:id/accept-nda", protect, acceptNda);
router.get("/:id/attachments/:index/signed-url", protect, getAttachmentUrl);
router.get("/:id/access-log", protect, authorize("employer", "client", "super_admin"), getJobAccessLog);

export default router;
