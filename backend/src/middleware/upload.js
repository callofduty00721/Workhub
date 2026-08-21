import multer from "multer";
import { ApiError } from "./errorHandler.js";

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

// This is just the outer ceiling multer enforces before our handler even runs —
// the real, tighter per-context limits (gig video 50MB/60s, chat video 256MB,
// documents 5-20MB) are enforced in uploadController.js. 256MB covers the
// largest case (chat video review files sent between client and freelancer).
export const upload = multer({
  storage,
  limits: { fileSize: 256 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, "Unsupported file type"));
  },
});
