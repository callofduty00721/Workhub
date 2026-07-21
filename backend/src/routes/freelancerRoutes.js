import { Router } from "express";
import { listFreelancers, getFreelancerProfile } from "../controllers/serviceController.js";

const router = Router();

router.get("/", listFreelancers);
router.get("/:id", getFreelancerProfile);

export default router;
