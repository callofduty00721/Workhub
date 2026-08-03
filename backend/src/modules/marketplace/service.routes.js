import { Router } from "express";
import {
  listServices,
  getMyServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getMyServiceAnalytics,
  getServiceCategoryCounts,
} from "./service.controller.js";
import { protect, authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", listServices);
router.get("/mine", protect, authorize("freelancer", "super_admin"), getMyServices);
router.get("/analytics/mine", protect, authorize("freelancer", "super_admin"), getMyServiceAnalytics);
router.get("/category-counts", getServiceCategoryCounts);
router.get("/:id", getServiceById);
router.post("/", protect, authorize("freelancer", "super_admin"), createService);
router.put("/:id", protect, updateService);
router.delete("/:id", protect, deleteService);

export default router;
