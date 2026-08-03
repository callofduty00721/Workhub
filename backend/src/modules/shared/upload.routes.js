import { Router } from "express";
import { uploadFile } from "./upload.controller.js";
import { upload } from "../../middleware/upload.js";
import { protect } from "../../middleware/auth.js";

const router = Router();

router.post("/", protect, upload.single("file"), uploadFile);

export default router;
