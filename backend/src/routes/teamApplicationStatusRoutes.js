import { Router } from "express";
import { updateTeamApplicationStatus } from "../controllers/teamApplicationController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.put("/:id/status", protect, updateTeamApplicationStatus);

export default router;
