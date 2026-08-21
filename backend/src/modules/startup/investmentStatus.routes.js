import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { updateInvestmentStatus, createVerificationOrder, verifyVerificationPayment } from "./investment.controller.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { updateInvestmentStatusSchema, verifyVerificationPaymentSchema } from "./investment.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.put("/:id/status", protect, validate(updateInvestmentStatusSchema), updateInvestmentStatus);
router.post("/:id/verify/order", protect, createVerificationOrder);
router.post("/:id/verify/confirm", protect, validate(verifyVerificationPaymentSchema), verifyVerificationPayment);

export default router;
