import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
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
};

// Caps how large an *image* Cloudinary actually stores, regardless of what the
// user uploaded — e.g. a 5MB 4000x4000 avatar gets downsized to 400x400 on
// Cloudinary's end before it's saved, so storage/bandwidth track the display
// size, not the upload size. `crop: "limit"` only ever shrinks, never upscales
// or crops content. Folders not listed here (documents, pitch decks, resumes)
// are left untouched.
const IMAGE_MAX_DIMENSIONS = {
  avatar: { width: 400, height: 400 },
  profile_cover: { width: 1200, height: 300 },
  startup_logo: { width: 400, height: 400 },
  startup_cover: { width: 1600, height: 500 },
  service_cover: { width: 1200, height: 630 },
};

export const uploadFile = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, "File uploads are not configured on this server yet. Set CLOUDINARY_* env vars.");
  }
  if (!req.file) throw new ApiError(400, "No file provided");

  const folderKey = req.body.folder;
  const folder = FOLDER_MAP[folderKey] || "mahahub/misc";
  const isImage = req.file.mimetype.startsWith("image/");
  const maxDimensions = IMAGE_MAX_DIMENSIONS[folderKey];

  const uploadOptions = { folder, resource_type: isImage ? "image" : "raw" };
  if (isImage && maxDimensions) {
    uploadOptions.transformation = [{ ...maxDimensions, crop: "limit", quality: "auto:good", fetch_format: "auto" }];
  }

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, uploadResult) =>
      error ? reject(error) : resolve(uploadResult)
    );
    uploadStream.end(req.file.buffer);
  });

  res.status(201).json({
    success: true,
    data: { url: result.secure_url, publicId: result.public_id, name: req.file.originalname },
  });
});
