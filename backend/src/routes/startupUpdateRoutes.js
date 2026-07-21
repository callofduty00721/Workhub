import { Router } from "express";
import { listUpdates, createUpdate } from "../controllers/startupUpdateController.js";
import { protect } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/", listUpdates);
router.post("/", protect, createUpdate);

export default router;
