import { Router } from "express";
import { uploadFile } from "./upload.controller.js";
import { upload } from "../../middleware/upload.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { uploadFileSchema } from "./upload.validation.js";

const router = Router();

// Validated after multer (upload.single) has parsed the multipart body into
// req.body/req.file — validating `folder` before that would see an empty body.
router.post("/", protect, upload.single("file"), validate(uploadFileSchema), uploadFile);

export default router;
