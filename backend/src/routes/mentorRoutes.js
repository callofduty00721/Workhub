import { Router } from "express";
import {
  listMentors,
  getMentorProfile,
  requestSession,
  getMentorSessions,
  getMySessionRequests,
  updateSessionStatus,
} from "../controllers/mentorController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/", listMentors);
router.get("/mine/sessions", protect, getMentorSessions);
router.get("/mine/requests", protect, getMySessionRequests);
router.put("/sessions/:id/status", protect, updateSessionStatus);
router.get("/:id", getMentorProfile);
router.post("/:id/sessions", protect, requestSession);

export default router;
