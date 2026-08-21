import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { listJobSeekers, getJobSeekerProfile } from "./jobSeeker.controller.js";
import { validate } from "../../middleware/validate.js";
import { listJobSeekersQuerySchema } from "./jobSeeker.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.get("/", validate(listJobSeekersQuerySchema, "query"), listJobSeekers);
router.get("/:id", getJobSeekerProfile);

export default router;
