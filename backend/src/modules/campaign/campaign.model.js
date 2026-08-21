import mongoose from "mongoose";
import crypto from "crypto";

const CAMPAIGN_PLATFORMS = ["instagram", "youtube", "linkedin", "twitter", "facebook", "other"];
const COLLABORATION_TYPES = ["paid", "barter", "affiliate", "hybrid"];
const PAYMENT_MODES = ["bank_transfer", "upi", "escrow", "other"];

// A brand's influencer-marketing brief — deliberately shaped like Job.js
// (employer/companyName/location/status/applicationsCount/viewsCount) so the
// existing Application flow (status, viewedAt, contract, signContract,
// withdraw) works against it unmodified via Application.onModel="Campaign".
const campaignSchema = new mongoose.Schema(
  {
    // A real, stored, guaranteed-unique reference code — not derived from
    // _id at display time. Assigned once in the pre("save") hook below,
    // same random-with-retry pattern userSchema uses for referralCode.
    campaignId: { type: String, unique: true, sparse: true },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    // Set when an agency posts this campaign for a client brand it manages
    // (see agencyClient.model.js — only allowed with an accepted
    // AgencyClient relationship, checked in createCampaign). `employer`
    // stays the agency, who actually manages/edits the posting; this is
    // just who it's really for, shown as "on behalf of" on the campaign.
    onBehalfOf: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    companyName: { type: String, required: true },
    description: { type: String, required: true },
    // A campaign can run across more than one platform at once (e.g.
    // Instagram + YouTube) — first entry is treated as the "lead" platform
    // wherever only one can be shown (banner color, etc.).
    platforms: { type: [{ type: String, enum: CAMPAIGN_PLATFORMS }], default: ["instagram"] },
    deliverables: { type: String, default: "" },
    niche: { type: String, default: "" },
    // Freeform influencer-category ask for this specific campaign (e.g.
    // "Beauty & Fashion") — distinct from `niche`, which is the platform's
    // free-text content-niche search field; this is what a Brand's public
    // profile campaign card shows as "Influencer Category".
    influencerCategory: { type: String, default: "" },
    minFollowers: { type: Number, default: 0 },
    location: { type: String, default: "Remote" },
    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["open", "closed", "draft"], default: "open" },
    // Set only by scripts/seed/seedDemoContent.js — lets marketplace cards
    // show a "Demo" badge on seeded content instead of passing it off as a
    // real listing, since the platform has no real users yet.
    isDemo: { type: Boolean, default: false },
    applicationsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    // How many influencers this campaign is looking to sign up — brand-set,
    // not a computed/self-reported number, so safe to show as-is on the card.
    collaboratorsMin: { type: Number, default: 0 },
    collaboratorsMax: { type: Number, default: 0 },
    // When the campaign content itself runs, and when the brand stops
    // accepting new applications — both optional, both brand-set.
    startDate: { type: Date },
    endDate: { type: Date },
    applicationDeadline: { type: Date },
    // Age range of the audience this campaign wants to reach — brand-set
    // targeting input, not a claim about the influencer's actual audience.
    targetAgeMin: { type: Number },
    targetAgeMax: { type: Number },
    // A minimum engagement rate the brand requires from applicants — a
    // requirement/filter like minFollowers, not a performance claim about
    // any specific influencer's actual (unverifiable, self-reported) audience.
    minEngagementRate: { type: Number },
    // The brand's own stated reach goal for this campaign — same trust level
    // as budgetMin/budgetMax (the poster's own declared numbers), not a
    // platform-computed estimate.
    estimatedReachMin: { type: Number },
    estimatedReachMax: { type: Number },
    collaborationType: { type: String, enum: COLLABORATION_TYPES, default: "paid" },
    paymentMode: { type: String, enum: PAYMENT_MODES, default: "escrow" },
    // Brand-authored campaign goals/highlights, shown as a checklist — free
    // text the brand writes, not inferred.
    highlights: [{ type: String }],
    termsAndConditions: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    // Admin-only flag (see campaign.controller.js's createCampaign/
    // updateCampaign, which strip this from the request body for anyone but
    // super_admin) — a brand can't self-declare its own campaign "featured".
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

campaignSchema.index({ title: "text", companyName: "text", niche: "text" });

// Excludes visually-ambiguous characters (0/O, 1/I) since this code is meant
// to be read aloud/typed by a human (support, disputes), not just stored.
const CAMPAIGN_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCampaignCode() {
  let code = "";
  for (let i = 0; i < 6; i += 1) code += CAMPAIGN_ID_CHARS[crypto.randomInt(CAMPAIGN_ID_CHARS.length)];
  return `CMP-${code}`;
}

campaignSchema.pre("save", async function assignCampaignId(next) {
  if (!this.isNew || this.campaignId) return next();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = randomCampaignCode();
    // eslint-disable-next-line no-await-in-loop
    const exists = await this.constructor.exists({ campaignId: candidate });
    if (!exists) {
      this.campaignId = candidate;
      break;
    }
  }
  next();
});

export const CAMPAIGN_PLATFORM_VALUES = CAMPAIGN_PLATFORMS;
export const COLLABORATION_TYPE_VALUES = COLLABORATION_TYPES;
export const PAYMENT_MODE_VALUES = PAYMENT_MODES;
export default mongoose.model("Campaign", campaignSchema);
