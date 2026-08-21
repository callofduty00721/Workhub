import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { listPartners, getPartnerProfile } from "./partner.controller.js";
import { validate } from "../../middleware/validate.js";
import { listPartnersQuerySchema } from "./partner.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.get("/", validate(listPartnersQuerySchema, "query"), listPartners);
router.get("/:id", getPartnerProfile);

export default router;
