import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { createCompany, getMyCompany, getPublicCompany, inviteMember, removeMember } from "./company.controller.js";
import { protect, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createCompanySchema, inviteMemberSchema } from "./company.validation.js";

const router = Router();
router.param("id", validateObjectId);
router.param("userId", validateObjectId);

// Registered before the blanket protect/authorize below — a profile page's
// Team tab is public, not restricted to the roles that manage a company.
router.get("/:id/public", getPublicCompany);

router.use(protect, authorize("employer", "client", "freelancer", "brand", "agency", "talent_partner", "super_admin"));

router.post("/", validate(createCompanySchema), createCompany);
router.get("/mine", getMyCompany);
router.post("/invite", validate(inviteMemberSchema), inviteMember);
router.delete("/members/:userId", removeMember);

export default router;
