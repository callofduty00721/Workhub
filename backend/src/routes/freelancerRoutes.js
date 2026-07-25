import { Router } from "express";
import { listFreelancers, getFreelancerProfile, toggleFollowFreelancer } from "../controllers/serviceController.js";
import { directHire } from "../controllers/projectController.js";
import { protect, optionalAuth, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", listFreelancers);
router.post("/:freelancerId/direct-hire", protect, authorize("employer", "client", "super_admin"), directHire);
router.get("/:id", optionalAuth, getFreelancerProfile);
router.post("/:id/follow", protect, toggleFollowFreelancer);

export default router;
