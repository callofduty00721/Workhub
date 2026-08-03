import mongoose from "mongoose";

const discussionCommentSchema = new mongoose.Schema(
  {
    discussion: { type: mongoose.Schema.Types.ObjectId, ref: "Discussion", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

discussionCommentSchema.index({ discussion: 1, createdAt: 1 });

export default mongoose.model("DiscussionComment", discussionCommentSchema);
