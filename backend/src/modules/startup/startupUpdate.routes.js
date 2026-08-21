import { Router } from "express";
import { listUpdates, createUpdate } from "./startupUpdate.controller.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createUpdateSchema } from "./startupUpdate.validation.js";

const router = Router({ mergeParams: true });

router.get("/", listUpdates);
router.post("/", protect, validate(createUpdateSchema), createUpdate);

export default router;
