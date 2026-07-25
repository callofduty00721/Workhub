import { Router } from "express";
import { listSkillTests, startSkillTest, submitSkillTest } from "../controllers/skillTestController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("freelancer", "super_admin"));

router.get("/", listSkillTests);
router.get("/:id/start", startSkillTest);
router.post("/:id/submit", submitSkillTest);

export default router;
