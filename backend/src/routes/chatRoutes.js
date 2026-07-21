import { Router } from "express";
import { getMyConversations, getOrCreateConversation, getMessages, sendMessage } from "../controllers/chatController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/conversations", getMyConversations);
router.post("/conversations", getOrCreateConversation);
router.get("/conversations/:id/messages", getMessages);
router.post("/conversations/:id/messages", sendMessage);

export default router;
