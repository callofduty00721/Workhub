import { Router } from "express";
import { listInvestors, getInvestorProfile, getMyDealFlow } from "../controllers/investorController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", listInvestors);
router.get("/mine/deal-flow", protect, authorize("investor", "super_admin"), getMyDealFlow);
router.get("/:id", getInvestorProfile);

export default router;
