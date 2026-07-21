import { Router } from "express";
import {
  createInvestment,
  listInvestments,
  createPreInvestmentVerificationOrder,
  createVerifiedInvestment,
} from "../controllers/investmentController.js";
import { protect } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/", protect, listInvestments);
router.post("/", protect, createInvestment);
router.post("/verify-order", protect, createPreInvestmentVerificationOrder);
router.post("/verified", protect, createVerifiedInvestment);

export default router;
