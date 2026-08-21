import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { createAlert, getMyAlerts, deleteAlert } from "./alert.controller.js";
import { protect, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createAlertSchema } from "./alert.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.use(protect, authorize("freelancer", "job_seeker", "super_admin"));

router.post("/", validate(createAlertSchema), createAlert);
router.get("/mine", getMyAlerts);
router.delete("/:id", deleteAlert);

export default router;
