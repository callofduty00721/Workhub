import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { getMyConversations, getOrCreateConversation, getMessages, sendMessage } from "./chat.controller.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { getOrCreateConversationSchema, sendMessageSchema } from "./chat.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.use(protect);

router.get("/conversations", getMyConversations);
router.post("/conversations", validate(getOrCreateConversationSchema), getOrCreateConversation);
router.get("/conversations/:id/messages", getMessages);
router.post("/conversations/:id/messages", validate(sendMessageSchema), sendMessage);

export default router;
