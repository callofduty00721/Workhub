import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import {
  selectCategory,
  addRoles,
  switchRole,
  requestVerification,
  listVerificationRequests,
  reviewVerification,
} from "./role.controller.js";
import { protect, authorize, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  selectCategorySchema,
  addRolesSchema,
  switchRoleSchema,
  requestVerificationSchema,
  reviewVerificationSchema,
} from "./role.validation.js";

const router = Router();
router.param("userId", validateObjectId);

router.post("/select-category", protect, validate(selectCategorySchema), selectCategory);
router.post("/add-roles", protect, validate(addRolesSchema), addRoles);
router.post("/switch", protect, validate(switchRoleSchema), switchRole);
router.post("/verification", protect, validate(requestVerificationSchema), requestVerification);

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
  validate(reviewVerificationSchema),
  reviewVerification
);

export default router;
