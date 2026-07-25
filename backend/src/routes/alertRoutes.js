import { Router } from "express";
import { createAlert, getMyAlerts, deleteAlert } from "../controllers/alertController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("freelancer", "super_admin"));

router.post("/", createAlert);
router.get("/mine", getMyAlerts);
router.delete("/:id", deleteAlert);

export default router;
