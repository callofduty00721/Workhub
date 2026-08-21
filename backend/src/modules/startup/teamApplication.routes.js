import { Router } from "express";
import { createTeamApplication, listTeamApplications } from "./teamApplication.controller.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createTeamApplicationSchema } from "./teamApplication.validation.js";

const router = Router({ mergeParams: true });

router.get("/", protect, listTeamApplications);
router.post("/", protect, validate(createTeamApplicationSchema), createTeamApplication);

export default router;
