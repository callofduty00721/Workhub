import { Router } from "express";
import { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", getMyNotifications);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);

export default router;
