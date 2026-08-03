import { Router } from "express";
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

const router = Router();

router.get("/", listContests);
router.get("/categories", getContestCategories);
router.get("/mine", protect, authorize("employer", "client", "super_admin"), getMyContests);
router.get("/entries/mine", protect, authorize("freelancer", "super_admin"), getMyEntries);
router.get("/:id", getContestById);
router.post("/", protect, authorize("employer", "client", "super_admin"), createContest);
router.put("/:id", protect, updateContest);
router.delete("/:id", protect, deleteContest);

router.post("/:id/entries", protect, authorize("freelancer", "super_admin"), submitEntry);
router.get("/:id/entries", protect, getContestEntries);
router.put("/:id/entries/:entryId/winner", protect, pickWinner);

export default router;
