import { Router } from "express";
import { updateInvestmentStatus, createVerificationOrder, verifyVerificationPayment } from "./investment.controller.js";
import { protect } from "../../middleware/auth.js";

const router = Router();

router.put("/:id/status", protect, updateInvestmentStatus);
router.post("/:id/verify/order", protect, createVerificationOrder);
router.post("/:id/verify/confirm", protect, verifyVerificationPayment);

export default router;
