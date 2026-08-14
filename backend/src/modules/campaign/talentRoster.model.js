import mongoose from "mongoose";

// A consent-gated relationship between an agency/talent_partner and an
// influencer who has agreed to be shown as one of "their" creators — never
// a unilateral listing. Follows the same {..., status: enum, timestamps}
// shape as Investment/TeamApplication rather than a generic "connection
// request" abstraction, matching this codebase's existing convention of one
// small dedicated model per relationship type.
const talentRosterSchema = new mongoose.Schema(
  {
    partner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    influencer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "declined", "removed"], default: "pending" },
    message: { type: String, default: "" },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One relationship per (partner, influencer) pair ever — re-inviting after a
// decline/removal updates the existing row's status rather than creating a
// duplicate, so history (who declined whom, when) isn't lost.
talentRosterSchema.index({ partner: 1, influencer: 1 }, { unique: true });

export default mongoose.model("TalentRoster", talentRosterSchema);
