import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { toggleUpdateLike } from "./startupUpdate.controller.js";
import { protect } from "../../middleware/auth.js";

const router = Router();
router.param("id", validateObjectId);

router.put("/:id/like", protect, toggleUpdateLike);

export default router;
