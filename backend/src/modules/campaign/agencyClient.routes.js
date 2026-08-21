import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import {
  inviteAgency,
  respondToAgencyInvite,
  listMyAgencies,
  listMyClients,
  listPendingAgencyInvites,
  removeAgencyClient,
} from "./agencyClient.controller.js";
import { protect, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { inviteAgencySchema, respondToAgencyInviteSchema } from "./agencyClient.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.post("/invite", protect, authorize("brand", "employer", "client", "super_admin"), validate(inviteAgencySchema), inviteAgency);
router.get("/mine", protect, authorize("brand", "employer", "client", "super_admin"), listMyAgencies);
router.get("/managed", protect, authorize("agency", "super_admin"), listMyClients);
router.get("/pending", protect, authorize("agency", "super_admin"), listPendingAgencyInvites);
router.post("/:id/respond", protect, authorize("agency", "super_admin"), validate(respondToAgencyInviteSchema), respondToAgencyInvite);
router.delete("/:id", protect, removeAgencyClient);

export default router;
