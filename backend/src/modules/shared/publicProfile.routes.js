import { Router } from "express";
import { getPublicProfile, listPublicProfiles } from "./publicProfile.controller.js";
import { optionalAuth } from "../../middleware/auth.js";

const router = Router();

// :role is restricted to brand/agency/talent_partner inside the controller
// (an unknown role 404s) rather than here, keeping the valid-role list in
// one place — PUBLIC_FIELDS_BY_ROLE / LIST_FIELDS_BY_ROLE.
router.get("/:role", listPublicProfiles);
router.get("/:role/:id", optionalAuth, getPublicProfile);

export default router;
