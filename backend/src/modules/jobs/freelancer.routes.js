import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { listFreelancers, getFreelancerProfile, toggleFollowFreelancer, getFreelancerCategoryCounts } from "../marketplace/service.controller.js";
import { directHire } from "./project.controller.js";
import { protect, optionalAuth, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { directHireSchema } from "./project.validation.js";
import { listFreelancersQuerySchema } from "../marketplace/service.validation.js";

const router = Router();
router.param("freelancerId", validateObjectId);
router.param("id", validateObjectId);

router.get("/", validate(listFreelancersQuerySchema, "query"), listFreelancers);
router.get("/category-counts", getFreelancerCategoryCounts);
router.post("/:freelancerId/direct-hire", protect, authorize("employer", "client", "super_admin"), validate(directHireSchema), directHire);
router.get("/:id", optionalAuth, getFreelancerProfile);
router.post("/:id/follow", protect, toggleFollowFreelancer);

export default router;
