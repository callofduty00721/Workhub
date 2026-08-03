import { Router } from "express";
import { createAlert, getMyAlerts, deleteAlert } from "./alert.controller.js";
import { protect, authorize } from "../../middleware/auth.js";

const router = Router();

router.use(protect, authorize("freelancer", "job_seeker", "super_admin"));

router.post("/", createAlert);
router.get("/mine", getMyAlerts);
router.delete("/:id", deleteAlert);

export default router;
