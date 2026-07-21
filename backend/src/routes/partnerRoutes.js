import { Router } from "express";
import { listPartners, getPartnerProfile } from "../controllers/partnerController.js";

const router = Router();

router.get("/", listPartners);
router.get("/:id", getPartnerProfile);

export default router;
