import { Router } from "express";
import { toggleLike, reportDiscussion } from "./discussion.controller.js";
import { listComments, createComment } from "./discussionComment.controller.js";
import { protect } from "../../middleware/auth.js";

const router = Router();

router.put("/:id/like", protect, toggleLike);
router.post("/:id/report", protect, reportDiscussion);
router.get("/:id/comments", listComments);
router.post("/:id/comments", protect, createComment);

export default router;
