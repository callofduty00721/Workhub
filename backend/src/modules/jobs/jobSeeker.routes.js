import { Router } from "express";
import { listJobSeekers, getJobSeekerProfile } from "./jobSeeker.controller.js";

const router = Router();

router.get("/", listJobSeekers);
router.get("/:id", getJobSeekerProfile);

export default router;
