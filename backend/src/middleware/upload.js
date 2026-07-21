import multer from "multer";

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
];

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Unsupported file type"));
  },
});
