import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { listFounders, getFounderProfile, toggleFollowFounder } from "./founder.controller.js";
import { protect, optionalAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { listFoundersQuerySchema } from "./founder.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.get("/", validate(listFoundersQuerySchema, "query"), listFounders);
router.get("/:id", optionalAuth, getFounderProfile);
router.post("/:id/follow", protect, toggleFollowFounder);

export default router;
