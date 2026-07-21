import Discussion from "../models/Discussion.js";
import DiscussionComment from "../models/DiscussionComment.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { notify } from "../utils/notify.js";

export const listComments = asyncHandler(async (req, res) => {
  const comments = await DiscussionComment.find({ discussion: req.params.id })
    .populate("author", "name avatar")
    .sort({ createdAt: 1 });
  res.json({ success: true, data: comments });
});

export const createComment = asyncHandler(async (req, res) => {
  const discussion = await Discussion.findById(req.params.id).populate("author", "name");
  if (!discussion) throw new ApiError(404, "Discussion not found");

  const comment = await DiscussionComment.create({
    discussion: discussion._id,
    author: req.user._id,
    body: req.body.body,
  });
  await comment.populate("author", "name avatar");

  discussion.commentCount += 1;
  await discussion.save();

  if (discussion.author._id.toString() !== req.user._id.toString()) {
    await notify(req.app, {
      user: discussion.author._id,
      type: "system",
      title: "New reply on your discussion",
      message: `${req.user.name} replied to "${discussion.title}"`,
      link: `/startups/${discussion.startup}`,
    });
  }

  res.status(201).json({ success: true, data: comment });
});
