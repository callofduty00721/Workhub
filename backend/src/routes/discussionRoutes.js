import { Router } from "express";
import { listDiscussions, createDiscussion } from "../controllers/discussionController.js";
import { protect } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/", listDiscussions);
router.post("/", protect, createDiscussion);

export default router;
