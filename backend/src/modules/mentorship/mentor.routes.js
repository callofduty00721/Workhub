import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import {
  listMentors,
  getMentorProfile,
  requestSession,
  getMentorSessions,
  getMySessionRequests,
  updateSessionStatus,
} from "./mentor.controller.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { requestSessionSchema, updateSessionStatusSchema, listMentorsQuerySchema } from "./mentor.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.get("/", validate(listMentorsQuerySchema, "query"), listMentors);
router.get("/mine/sessions", protect, getMentorSessions);
router.get("/mine/requests", protect, getMySessionRequests);
router.put("/sessions/:id/status", protect, validate(updateSessionStatusSchema), updateSessionStatus);
router.get("/:id", getMentorProfile);
router.post("/:id/sessions", protect, validate(requestSessionSchema), requestSession);

export default router;
