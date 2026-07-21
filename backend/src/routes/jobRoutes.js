import { Router } from "express";
import {
  listJobs,
  getMyJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyToJob,
  getJobApplications,
  updateApplicationStatus,
} from "../controllers/jobController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", listJobs);
router.get("/mine", protect, authorize("employer", "client", "super_admin"), getMyJobs);
router.get("/:id", getJobById);
router.post("/", protect, authorize("employer", "client", "super_admin"), createJob);
router.put("/:id", protect, updateJob);
router.delete("/:id", protect, deleteJob);

router.post("/:id/apply", protect, authorize("freelancer", "super_admin"), applyToJob);
router.get("/:id/applications", protect, authorize("employer", "client", "super_admin"), getJobApplications);
router.put("/applications/:id/status", protect, authorize("employer", "client", "super_admin"), updateApplicationStatus);

export default router;
