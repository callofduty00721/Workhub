import { Router } from "express";
import { listFreelancers, getFreelancerProfile, toggleFollowFreelancer, getFreelancerCategoryCounts } from "../marketplace/service.controller.js";
import { directHire } from "./project.controller.js";
import { protect, optionalAuth, authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", listFreelancers);
router.get("/category-counts", getFreelancerCategoryCounts);
router.post("/:freelancerId/direct-hire", protect, authorize("employer", "client", "super_admin"), directHire);
router.get("/:id", optionalAuth, getFreelancerProfile);
router.post("/:id/follow", protect, toggleFollowFreelancer);

export default router;
