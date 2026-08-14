import { Router } from "express";
import {
  inviteAgency,
  respondToAgencyInvite,
  listMyAgencies,
  listMyClients,
  listPendingAgencyInvites,
  removeAgencyClient,
} from "./agencyClient.controller.js";
import { protect, authorize } from "../../middleware/auth.js";

const router = Router();

router.post("/invite", protect, authorize("brand", "employer", "client", "super_admin"), inviteAgency);
router.get("/mine", protect, authorize("brand", "employer", "client", "super_admin"), listMyAgencies);
router.get("/managed", protect, authorize("agency", "super_admin"), listMyClients);
router.get("/pending", protect, authorize("agency", "super_admin"), listPendingAgencyInvites);
router.post("/:id/respond", protect, authorize("agency", "super_admin"), respondToAgencyInvite);
router.delete("/:id", protect, removeAgencyClient);

export default router;
