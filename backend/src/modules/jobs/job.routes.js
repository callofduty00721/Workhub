import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import {
  listJobs,
  getJobCategoryCounts,
  getJobSalaryRangeCounts,
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
  reportJob,
} from "./job.controller.js";
import { protect, optionalAuth, authorize } from "../../middleware/auth.js";
import { requireVerifiedForAction } from "../../middleware/roleAuth.js";
import { validate } from "../../middleware/validate.js";
import {
  createJobSchema,
  updateJobSchema,
  inviteFreelancerSchema,
  applyToJobSchema,
  reportJobSchema,
  updateApplicationStatusSchema,
  scheduleInterviewSchema,
  listJobsQuerySchema,
} from "./job.validation.js";

const router = Router();
router.param("freelancerId", validateObjectId);
router.param("id", validateObjectId);

router.get("/", validate(listJobsQuerySchema, "query"), listJobs);
router.get("/category-counts", getJobCategoryCounts);
router.get("/salary-range-counts", getJobSalaryRangeCounts);
router.get("/mine", protect, authorize("employer", "client", "super_admin"), getMyJobs);
router.get("/invited", protect, authorize("freelancer", "super_admin"), getInvitedJobs);
router.get("/analytics/mine", protect, authorize("employer", "client", "super_admin"), getMyJobAnalytics);
router.get("/:id", optionalAuth, getJobById);
router.post("/", protect, authorize("employer", "super_admin"), requireVerifiedForAction("post_job"), validate(createJobSchema), createJob);
router.put("/:id", protect, validate(updateJobSchema), updateJob);
router.delete("/:id", protect, deleteJob);

router.post("/:id/apply", protect, authorize("freelancer", "job_seeker", "super_admin"), validate(applyToJobSchema), applyToJob);
router.get("/:id/applications", protect, authorize("employer", "client", "super_admin"), getJobApplications);
router.put(
  "/applications/:id/status",
  protect,
  authorize("employer", "client", "super_admin"),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus
);
router.put(
  "/applications/:id/schedule-interview",
  protect,
  authorize("employer", "client", "super_admin"),
  validate(scheduleInterviewSchema),
  scheduleInterview
);
router.put("/applications/:id/confirm-interview", protect, authorize("freelancer", "job_seeker", "super_admin"), confirmInterview);

router.put("/:id/invite", protect, authorize("employer", "client", "super_admin"), validate(inviteFreelancerSchema), inviteFreelancer);
router.delete("/:id/invite/:freelancerId", protect, authorize("employer", "client", "super_admin"), revokeInvite);
router.post("/:id/accept-nda", protect, acceptNda);
router.get("/:id/attachments/:index/signed-url", protect, getAttachmentUrl);
router.get("/:id/access-log", protect, authorize("employer", "client", "super_admin"), getJobAccessLog);
router.post("/:id/report", protect, validate(reportJobSchema), reportJob);

export default router;
