import mongoose from "mongoose";

// A consent-gated relationship between a brand and an agency it's delegating
// campaign work to — the brand invites, the agency accepts/declines. Follows
// the same {..., status: enum, timestamps} shape as TalentRoster/Investment/
// TeamApplication rather than a generic "connection request" abstraction,
// matching this codebase's existing convention of one small dedicated model
// per relationship type. Once accepted, the agency can post Campaigns with
// `onBehalfOf` set to this brand (see campaign.controller.js's createCampaign).
const agencyClientSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    agency: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "declined", "removed"], default: "pending" },
    // The brand's stated budget for what they're delegating — informational
    // (shown on both sides), not enforced against any one Campaign's amounts.
    budget: { type: Number, default: 0 },
    message: { type: String, default: "" },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One relationship per (brand, agency) pair ever — re-inviting after a
// decline/removal updates the existing row's status rather than creating a
// duplicate, same reasoning as TalentRoster's index.
agencyClientSchema.index({ brand: 1, agency: 1 }, { unique: true });

export default mongoose.model("AgencyClient", agencyClientSchema);
