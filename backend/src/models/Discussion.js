import mongoose from "mongoose";

const discussionSchema = new mongoose.Schema(
  {
    startup: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    category: {
      type: String,
      enum: ["Questions", "Feedback", "Partnerships", "Investors", "General"],
      default: "General",
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    // Internal moderation data — never selected/returned in any public-facing query.
    reports: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

discussionSchema.index({ startup: 1, createdAt: -1 });

export default mongoose.model("Discussion", discussionSchema);
