import mongoose from "mongoose";

const CAMPAIGN_PLATFORMS = ["instagram", "youtube", "linkedin", "twitter", "facebook", "other"];

// A brand's influencer-marketing brief — deliberately shaped like Job.js
// (employer/companyName/location/status/applicationsCount/viewsCount) so the
// existing Application flow (status, viewedAt, contract, signContract,
// withdraw) works against it unmodified via Application.onModel="Campaign".
const campaignSchema = new mongoose.Schema(
  {
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    title: { type: String, required: true, trim: true },
    companyName: { type: String, required: true },
    description: { type: String, required: true },
    platform: { type: String, enum: CAMPAIGN_PLATFORMS, default: "instagram" },
    deliverables: { type: String, default: "" },
    niche: { type: String, default: "" },
    location: { type: String, default: "Remote" },
    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["open", "closed", "draft"], default: "open" },
    applicationsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

campaignSchema.index({ title: "text", companyName: "text", niche: "text" });

export const CAMPAIGN_PLATFORM_VALUES = CAMPAIGN_PLATFORMS;
export default mongoose.model("Campaign", campaignSchema);
