import { Router } from "express";
import { createTeamApplication, listTeamApplications } from "../controllers/teamApplicationController.js";
import { protect } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/", protect, listTeamApplications);
router.post("/", protect, createTeamApplication);

export default router;
