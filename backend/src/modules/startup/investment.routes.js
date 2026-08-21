import { Router } from "express";
import {
  createInvestment,
  listInvestments,
  createPreInvestmentVerificationOrder,
  createVerifiedInvestment,
} from "./investment.controller.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createInvestmentSchema, createPreInvestmentVerificationOrderSchema, createVerifiedInvestmentSchema } from "./investment.validation.js";

const router = Router({ mergeParams: true });

router.get("/", protect, listInvestments);
router.post("/", protect, validate(createInvestmentSchema), createInvestment);
router.post("/verify-order", protect, validate(createPreInvestmentVerificationOrderSchema), createPreInvestmentVerificationOrder);
router.post("/verified", protect, validate(createVerifiedInvestmentSchema), createVerifiedInvestment);

export default router;
