import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
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
import { validate } from "../../middleware/validate.js";
import { createServiceSchema, updateServiceSchema, listServicesQuerySchema } from "./service.validation.js";

const router = Router();
router.param("id", validateObjectId);

router.get("/", validate(listServicesQuerySchema, "query"), listServices);
router.get("/mine", protect, authorize("freelancer", "super_admin"), getMyServices);
router.get("/analytics/mine", protect, authorize("freelancer", "super_admin"), getMyServiceAnalytics);
router.get("/category-counts", getServiceCategoryCounts);
router.get("/:id", getServiceById);
router.post("/", protect, authorize("freelancer", "super_admin"), validate(createServiceSchema), createService);
router.put("/:id", protect, validate(updateServiceSchema), updateService);
router.delete("/:id", protect, deleteService);

export default router;
