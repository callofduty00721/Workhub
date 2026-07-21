import mongoose from "mongoose";

const startupUpdateSchema = new mongoose.Schema(
  {
    startup: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "Announcement" },
    image: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

startupUpdateSchema.index({ startup: 1, createdAt: -1 });

export default mongoose.model("StartupUpdate", startupUpdateSchema);
