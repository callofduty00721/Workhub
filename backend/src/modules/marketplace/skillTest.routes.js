import { Router } from "express";
import { listSkillTests, startSkillTest, submitSkillTest } from "./skillTest.controller.js";
import { protect, authorize } from "../../middleware/auth.js";

const router = Router();

router.use(protect, authorize("job_seeker", "super_admin"));

router.get("/", listSkillTests);
router.get("/:id/start", startSkillTest);
router.post("/:id/submit", submitSkillTest);

export default router;
