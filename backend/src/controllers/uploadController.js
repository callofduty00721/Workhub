import { PutObjectCommand } from "@aws-sdk/client-s3";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import { getR2Client, isR2Configured } from "../config/r2.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const FOLDER_MAP = {
  avatar: "mahahub/avatars",
  profile_cover: "mahahub/profile-covers",
  startup_logo: "mahahub/startup-logos",
  startup_cover: "mahahub/startup-covers",
  pitch_deck: "mahahub/pitch-decks",
  document: "mahahub/documents",
  resume: "mahahub/resumes",
  service_cover: "mahahub/service-covers",
  service_video: "mahahub/service-videos",
  profile_video: "mahahub/profile-videos",
  chat_attachment: "mahahub/chat-attachments",
  job_attachment: "mahahub/job-attachments",
};

// Bulk/raw files that never need image or video processing go to Cloudflare R2
// (cheap object storage, no transformation, no per-GB bandwidth fee) instead of
// Cloudinary — Cloudinary is reserved for assets that actually benefit from its
// resize/quality pipeline (avatars, covers, gig video).
const R2_FOLDERS = new Set(["document", "resume", "pitch_deck", "chat_attachment", "job_attachment"]);

// Per-folder caps for R2 uploads — deliberately tighter than the 50MB multer
// ceiling so nobody can quietly burn through storage with oversized junk.
const R2_MAX_BYTES = {
  resume: 5 * 1024 * 1024,
  document: 10 * 1024 * 1024,
  pitch_deck: 20 * 1024 * 1024,
  // A single chat attachment can be up to this — the real per-*message* guard
  // is the combined-256MB check in chatController.sendMessage, since a message
  // can carry several attachments uploaded as separate requests.
  chat_attachment: 256 * 1024 * 1024,
  job_attachment: 50 * 1024 * 1024,
};

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 60;

// Caps how large an *image* Cloudinary actually stores, regardless of what the
// user uploaded — e.g. a 5MB 4000x4000 avatar gets downsized to 400x400 on
// Cloudinary's end before it's saved, so storage/bandwidth track the display
// size, not the upload size. `crop: "limit"` only ever shrinks, never upscales
// or crops content.
const IMAGE_MAX_DIMENSIONS = {
  avatar: { width: 400, height: 400 },
  profile_cover: { width: 1200, height: 300 },
  startup_logo: { width: 400, height: 400 },
  startup_cover: { width: 1600, height: 500 },
  service_cover: { width: 1200, height: 630 },
};

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file provided");

  const folderKey = req.body.folder;
  if (R2_FOLDERS.has(folderKey)) {
    return uploadToR2(req, res, folderKey);
  }
  return uploadToCloudinary(req, res, folderKey);
});

async function uploadToR2(req, res, folderKey) {
  if (!isR2Configured()) {
    throw new ApiError(503, "File storage is not configured on this server yet. Set R2_* env vars.");
  }

  const maxBytes = R2_MAX_BYTES[folderKey] ?? 10 * 1024 * 1024;
  if (req.file.size > maxBytes) {
    throw new ApiError(400, `File must be under ${Math.round(maxBytes / (1024 * 1024))}MB`);
  }

  const folder = FOLDER_MAP[folderKey] || "mahahub/misc";
  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${folder}/${Date.now()}-${safeName}`;

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    })
  );

  res.status(201).json({
    success: true,
    data: { url: `${process.env.R2_PUBLIC_URL}/${key}`, publicId: key, name: req.file.originalname, size: req.file.size },
  });
}

async function uploadToCloudinary(req, res, folderKey) {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, "File uploads are not configured on this server yet. Set CLOUDINARY_* env vars.");
  }

  const folder = FOLDER_MAP[folderKey] || "mahahub/misc";
  const isImage = req.file.mimetype.startsWith("image/");
  const isVideo = req.file.mimetype.startsWith("video/");
  const maxDimensions = IMAGE_MAX_DIMENSIONS[folderKey];

  if (isVideo && req.file.size > MAX_VIDEO_BYTES) {
    throw new ApiError(400, "Videos must be under 50MB");
  }

  const uploadOptions = { folder, resource_type: isVideo ? "video" : isImage ? "image" : "raw" };
  if (isImage && maxDimensions) {
    uploadOptions.transformation = [{ ...maxDimensions, crop: "limit", quality: "auto:good", fetch_format: "auto" }];
  }

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, uploadResult) =>
      error ? reject(error) : resolve(uploadResult)
    );
    uploadStream.end(req.file.buffer);
  });

  // Client-side duration checks can be bypassed, so re-verify against
  // Cloudinary's own measured duration and delete the asset if it's too long.
  if (isVideo && result.duration > MAX_VIDEO_SECONDS) {
    await cloudinary.uploader.destroy(result.public_id, { resource_type: "video" });
    throw new ApiError(400, `Videos must be ${MAX_VIDEO_SECONDS} seconds or shorter`);
  }

  res.status(201).json({
    success: true,
    data: { url: result.secure_url, publicId: result.public_id, name: req.file.originalname, size: req.file.size },
  });
}
