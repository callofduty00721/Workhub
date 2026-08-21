import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { updateTeamApplicationStatus } from "./teamApplication.controller.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { updateTeamApplicationStatusSchema } from "./teamApplication.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.put("/:id/status", protect, validate(updateTeamApplicationStatusSchema), updateTeamApplicationStatus);

export default router;
