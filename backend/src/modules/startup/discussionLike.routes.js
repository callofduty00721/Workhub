import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { toggleLike, reportDiscussion } from "./discussion.controller.js";
import { listComments, createComment } from "./discussionComment.controller.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { reportDiscussionSchema, createCommentSchema } from "./discussion.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.put("/:id/like", protect, toggleLike);
router.post("/:id/report", protect, validate(reportDiscussionSchema), reportDiscussion);
router.get("/:id/comments", listComments);
router.post("/:id/comments", protect, validate(createCommentSchema), createComment);

export default router;
