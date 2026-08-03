import { Router } from "express";
import {
  selectCategory,
  addRoles,
  switchRole,
  requestVerification,
  listVerificationRequests,
  reviewVerification,
} from "./role.controller.js";
import { protect, authorize } from "../../middleware/auth.js";

const router = Router();

router.post("/select-category", protect, selectCategory);
router.post("/add-roles", protect, addRoles);
router.post("/switch", protect, switchRole);
router.post("/verification", protect, requestVerification);

router.get("/verification-requests", protect, authorize("super_admin"), listVerificationRequests);
router.put("/verification-requests/:userId/review", protect, authorize("super_admin"), reviewVerification);

export default router;
