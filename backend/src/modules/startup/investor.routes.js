import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { listInvestors, getInvestorProfile, getMyDealFlow } from "./investor.controller.js";
import { protect, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { listInvestorsQuerySchema } from "./investor.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.get("/", validate(listInvestorsQuerySchema, "query"), listInvestors);
router.get("/mine/deal-flow", protect, authorize("investor", "super_admin"), getMyDealFlow);
router.get("/:id", getInvestorProfile);

export default router;
