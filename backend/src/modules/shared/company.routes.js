import { Router } from "express";
import { createCompany, getMyCompany, getPublicCompany, inviteMember, removeMember } from "./company.controller.js";
import { protect, authorize } from "../../middleware/auth.js";

const router = Router();

// Registered before the blanket protect/authorize below — a profile page's
// Team tab is public, not restricted to the roles that manage a company.
router.get("/:id/public", getPublicCompany);

router.use(protect, authorize("employer", "client", "freelancer", "brand", "agency", "talent_partner", "super_admin"));

router.post("/", createCompany);
router.get("/mine", getMyCompany);
router.post("/invite", inviteMember);
router.delete("/members/:userId", removeMember);

export default router;
