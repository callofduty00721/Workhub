import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import {
  listContests,
  getContestCategories,
  getMyContests,
  getContestById,
  createContest,
  updateContest,
  deleteContest,
  submitEntry,
  getContestEntries,
  getMyEntries,
  pickWinner,
} from "./contest.controller.js";
import { protect, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createContestSchema, updateContestSchema, submitEntrySchema, listContestsQuerySchema } from "./contest.validation.js";

const router = Router();
router.param("entryId", validateObjectId);
router.param("id", validateObjectId);

router.get("/", validate(listContestsQuerySchema, "query"), listContests);
router.get("/categories", getContestCategories);
router.get("/mine", protect, authorize("employer", "client", "super_admin"), getMyContests);
router.get("/entries/mine", protect, authorize("freelancer", "super_admin"), getMyEntries);
router.get("/:id", getContestById);
router.post("/", protect, authorize("employer", "client", "super_admin"), validate(createContestSchema), createContest);
router.put("/:id", protect, validate(updateContestSchema), updateContest);
router.delete("/:id", protect, deleteContest);

router.post("/:id/entries", protect, authorize("freelancer", "super_admin"), validate(submitEntrySchema), submitEntry);
router.get("/:id/entries", protect, getContestEntries);
router.put("/:id/entries/:entryId/winner", protect, pickWinner);

export default router;
