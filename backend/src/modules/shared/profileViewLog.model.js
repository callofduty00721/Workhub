import mongoose from "mongoose";

// One bucket per user per day — upserted with $inc on every public profile
// view, so "Profile Views" can be charted as a real trend over time instead
// of only the running total on User.profileViews.
const profileViewLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  count: { type: Number, default: 0 },
});

profileViewLogSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("ProfileViewLog", profileViewLogSchema);
