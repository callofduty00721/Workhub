import mongoose from "mongoose";

const contestSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    skills: [{ type: String }],
    prizeAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ["open", "judging", "closed"], default: "open" },
    entriesCount: { type: Number, default: 0 },
    winnerEntry: { type: mongoose.Schema.Types.ObjectId, ref: "ContestEntry" },
  },
  { timestamps: true }
);

contestSchema.index({ title: "text", category: "text", skills: "text" });

export default mongoose.model("Contest", contestSchema);
