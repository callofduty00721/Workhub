import { Router } from "express";
import { listPartners, getPartnerProfile } from "./partner.controller.js";

const router = Router();

router.get("/", listPartners);
router.get("/:id", getPartnerProfile);

export default router;
