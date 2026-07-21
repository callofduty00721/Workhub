import { Router } from "express";
import { getMyApplications, withdrawApplication } from "../controllers/jobController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/mine", protect, getMyApplications);
router.put("/:id/withdraw", protect, withdrawApplication);

export default router;
