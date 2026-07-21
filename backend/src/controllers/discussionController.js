import Discussion from "../models/Discussion.js";
import Startup from "../models/Startup.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { notify } from "../utils/notify.js";

export const listDiscussions = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = { startup: req.params.startupId };
  if (category && category !== "All Discussions") filter.category = category;

  const discussions = await Discussion.find(filter).select("-reports").populate("author", "name avatar").sort({ createdAt: -1 });
  res.json({ success: true, data: discussions });
});

export const createDiscussion = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.startupId);
  if (!startup) throw new ApiError(404, "Startup not found");

  const discussion = await Discussion.create({
    startup: startup._id,
    author: req.user._id,
    title: req.body.title,
    body: req.body.body,
    category: req.body.category,
  });
  await discussion.populate("author", "name avatar");

  if (startup.founder.toString() !== req.user._id.toString()) {
    await notify(req.app, {
      user: startup.founder,
      type: "system",
      title: "New discussion on your startup",
      message: `${req.user.name} started a discussion: ${req.body.title}`,
      link: `/startups/${startup._id}`,
    });
  }

  res.status(201).json({ success: true, data: discussion });
});

export const toggleLike = asyncHandler(async (req, res) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) throw new ApiError(404, "Discussion not found");

  const userId = req.user._id.toString();
  const alreadyLiked = discussion.likes.some((id) => id.toString() === userId);

  if (alreadyLiked) {
    discussion.likes = discussion.likes.filter((id) => id.toString() !== userId);
  } else {
    discussion.likes.push(req.user._id);
  }

  await discussion.save();
  res.json({ success: true, liked: !alreadyLiked, likeCount: discussion.likes.length });
});

export const reportDiscussion = asyncHandler(async (req, res) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) throw new ApiError(404, "Discussion not found");

  const userId = req.user._id.toString();
  const alreadyReported = discussion.reports.some((r) => r.user.toString() === userId);

  if (!alreadyReported) {
    discussion.reports.push({ user: req.user._id, reason: req.body.reason || "" });
    await discussion.save();
  }

  res.json({ success: true, message: "Thanks — this discussion has been reported to the moderation team." });
});
