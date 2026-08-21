import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { getPublicProfile, listPublicProfiles } from "./publicProfile.controller.js";
import { optionalAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { listPublicProfilesQuerySchema } from "./publicProfile.validation.js";

const router = Router();
router.param("id", validateObjectId);

// :role is restricted to brand/agency/talent_partner inside the controller
// (an unknown role 404s) rather than here, keeping the valid-role list in
// one place — PUBLIC_FIELDS_BY_ROLE / LIST_FIELDS_BY_ROLE.
router.get("/:role", validate(listPublicProfilesQuerySchema, "query"), listPublicProfiles);
router.get("/:role/:id", optionalAuth, getPublicProfile);

export default router;
