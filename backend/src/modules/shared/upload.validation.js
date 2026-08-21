import { z } from "zod";
import { FOLDER_MAP } from "./upload.controller.js";

// multer's upload.single("file") populates req.body with the request's other
// text fields before this runs — `folder` picks both the storage backend
// (R2 vs Cloudinary, see upload.controller.js's R2_FOLDERS) and the
// destination path, so it must be one of the real, known folder keys rather
// than an arbitrary string that could otherwise land files in an unexpected
// path. The file itself is validated separately by multer's fileFilter
// (middleware/upload.js's MIME allowlist and size cap).
export const uploadFileSchema = z.object({ folder: z.enum(Object.keys(FOLDER_MAP)) }).strict();
