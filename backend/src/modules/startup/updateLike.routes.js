import { Router } from "express";
import { toggleUpdateLike } from "./startupUpdate.controller.js";
import { protect } from "../../middleware/auth.js";

const router = Router();

router.put("/:id/like", protect, toggleUpdateLike);

export default router;
