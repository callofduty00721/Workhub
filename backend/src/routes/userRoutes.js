import { Router } from "express";
import { updateMyProfile } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.put("/me", protect, updateMyProfile);

export default router;
