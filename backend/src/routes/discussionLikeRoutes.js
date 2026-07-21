import { Router } from "express";
import { toggleLike, reportDiscussion } from "../controllers/discussionController.js";
import { listComments, createComment } from "../controllers/discussionCommentController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.put("/:id/like", protect, toggleLike);
router.post("/:id/report", protect, reportDiscussion);
router.get("/:id/comments", listComments);
router.post("/:id/comments", protect, createComment);

export default router;
