import { Router } from "express";
import {
  selectCategory,
  addRoles,
  switchRole,
  requestVerification,
  listVerificationRequests,
  reviewVerification,
} from "./role.controller.js";
import { protect, authorize, requirePermission } from "../../middleware/auth.js";

const router = Router();

router.post("/select-category", protect, selectCategory);
router.post("/add-roles", protect, addRoles);
router.post("/switch", protect, switchRole);
router.post("/verification", protect, requestVerification);

router.get(
  "/verification-requests",
  protect,
  authorize("super_admin", "staff"),
  requirePermission("role-verifications"),
  listVerificationRequests
);
router.put(
  "/verification-requests/:userId/review",
  protect,
  authorize("super_admin", "staff"),
  requirePermission("role-verifications"),
  reviewVerification
);

export default router;
