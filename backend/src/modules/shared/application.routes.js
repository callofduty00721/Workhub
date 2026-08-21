import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { getMyApplications, withdrawApplication, editApplication, requestRateChange, signContract } from "../jobs/job.controller.js";
import { createMilestones, getMilestones, deleteMilestones } from "../jobs/milestone.controller.js";
import { addTimeEntry, getTimeEntries, deleteTimeEntry } from "../jobs/timeEntry.controller.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { editApplicationSchema, requestRateChangeSchema, signContractSchema } from "../jobs/job.validation.js";
import { createMilestonesSchema } from "../jobs/milestone.validation.js";
import { addTimeEntrySchema } from "../jobs/timeEntry.validation.js";

const router = Router();
router.param("applicationId", validateObjectId);
router.param("id", validateObjectId);

router.get("/mine", protect, getMyApplications);
router.put("/:id/withdraw", protect, withdrawApplication);
router.put("/:id", protect, validate(editApplicationSchema), editApplication);
router.put("/:id/request-rate-change", protect, validate(requestRateChangeSchema), requestRateChange);
router.post("/:applicationId/contract/sign", protect, validate(signContractSchema), signContract);

router.post("/:applicationId/milestones", protect, validate(createMilestonesSchema), createMilestones);
router.get("/:applicationId/milestones", protect, getMilestones);
router.delete("/:applicationId/milestones", protect, deleteMilestones);

router.post("/:applicationId/time-entries", protect, validate(addTimeEntrySchema), addTimeEntry);
router.get("/:applicationId/time-entries", protect, getTimeEntries);
router.delete("/time-entries/:id", protect, deleteTimeEntry);

export default router;
