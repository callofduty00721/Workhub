import { Router } from "express";
import { listDiscussions, createDiscussion } from "./discussion.controller.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createDiscussionSchema, listDiscussionsQuerySchema } from "./discussion.validation.js";

const router = Router({ mergeParams: true });

router.get("/", validate(listDiscussionsQuerySchema, "query"), listDiscussions);
router.post("/", protect, validate(createDiscussionSchema), createDiscussion);

export default router;
