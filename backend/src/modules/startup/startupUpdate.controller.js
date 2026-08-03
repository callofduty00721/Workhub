import StartupUpdate from "./startupUpdate.model.js";
import Startup from "./startup.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { assertStartupFounder } from "./founderAuth.js";

export const listUpdates = asyncHandler(async (req, res) => {
  const updates = await StartupUpdate.find({ startup: req.params.startupId }).sort({ createdAt: -1 });

  // Same "increment on every fetch" convention as Startup.viewCount — a proxy
  // for "this update was seen" rather than precise per-card visibility tracking.
  if (updates.length) {
    await StartupUpdate.updateMany({ _id: { $in: updates.map((u) => u._id) } }, { $inc: { viewCount: 1 } });
  }

  const data = updates.map((u) => ({ ...u.toObject(), viewCount: (u.viewCount ?? 0) + 1 }));
  res.json({ success: true, data });
});

export const createUpdate = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.startupId);
  if (!startup) throw new ApiError(404, "Startup not found");
  assertStartupFounder(startup, req.user, "Only the founder can post updates");

  const update = await StartupUpdate.create({
    startup: startup._id,
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    image: req.body.image,
  });

  res.status(201).json({ success: true, data: update });
});

export const toggleUpdateLike = asyncHandler(async (req, res) => {
  const update = await StartupUpdate.findById(req.params.id);
  if (!update) throw new ApiError(404, "Update not found");

  const userId = req.user._id.toString();
  const alreadyLiked = update.likes.some((id) => id.toString() === userId);

  if (alreadyLiked) {
    update.likes = update.likes.filter((id) => id.toString() !== userId);
  } else {
    update.likes.push(req.user._id);
  }

  await update.save();
  res.json({ success: true, liked: !alreadyLiked, likeCount: update.likes.length });
});
