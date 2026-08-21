import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { listSkillTests, startSkillTest, submitSkillTest } from "./skillTest.controller.js";
import { protect, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { submitSkillTestSchema } from "./skillTest.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.use(protect, authorize("job_seeker", "super_admin"));

router.get("/", listSkillTests);
router.get("/:id/start", startSkillTest);
router.post("/:id/submit", validate(submitSkillTestSchema), submitSkillTest);

export default router;
