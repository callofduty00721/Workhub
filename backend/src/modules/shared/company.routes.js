import { Router } from "express";
import { createCompany, getMyCompany, inviteMember, removeMember } from "./company.controller.js";
import { protect, authorize } from "../../middleware/auth.js";

const router = Router();

router.use(protect, authorize("employer", "client", "freelancer", "super_admin"));

router.post("/", createCompany);
router.get("/mine", getMyCompany);
router.post("/invite", inviteMember);
router.delete("/members/:userId", removeMember);

export default router;
