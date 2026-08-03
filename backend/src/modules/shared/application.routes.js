import { Router } from "express";
import { getMyApplications, withdrawApplication, signContract } from "../jobs/job.controller.js";
import { createMilestones, getMilestones, deleteMilestones } from "../jobs/milestone.controller.js";
import { addTimeEntry, getTimeEntries, deleteTimeEntry } from "../jobs/timeEntry.controller.js";
import { protect } from "../../middleware/auth.js";

const router = Router();

router.get("/mine", protect, getMyApplications);
router.put("/:id/withdraw", protect, withdrawApplication);
router.post("/:applicationId/contract/sign", protect, signContract);

router.post("/:applicationId/milestones", protect, createMilestones);
router.get("/:applicationId/milestones", protect, getMilestones);
router.delete("/:applicationId/milestones", protect, deleteMilestones);

router.post("/:applicationId/time-entries", protect, addTimeEntry);
router.get("/:applicationId/time-entries", protect, getTimeEntries);
router.delete("/time-entries/:id", protect, deleteTimeEntry);

export default router;
