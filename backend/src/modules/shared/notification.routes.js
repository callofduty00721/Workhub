import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } from "./notification.controller.js";
import { protect } from "../../middleware/auth.js";

const router = Router();
router.param("id", validateObjectId);

router.use(protect);

router.get("/", getMyNotifications);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);

export default router;
