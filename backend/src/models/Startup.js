import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    bio: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    avatar: { type: String, default: "" },
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    images: [{ type: String }],
    tag: { type: String, default: "" },
    tags: [{ type: String }],
    url: { type: String, default: "" },
    price: { type: String, default: "" },
    status: { type: String, enum: ["live", "beta", "coming_soon"], default: "live" },
    features: [{ type: String }],
  },
  { _id: false }
);

const planPhaseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    timeframe: { type: String, default: "" },
    checklist: [{ type: String }],
    estimatedCost: { type: Number, default: 0 },
  },
  { _id: false }
);

const marketStatSchema = new mongoose.Schema(
  { value: { type: String, required: true }, label: { type: String, required: true } },
  { _id: false }
);

const processStepSchema = new mongoose.Schema(
  { title: { type: String, required: true }, description: { type: String, default: "" } },
  { _id: false }
);

const openRoleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["full_time", "part_time"], default: "full_time" },
    workMode: { type: String, enum: ["on_site", "remote", "hybrid"], default: "on_site" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const tractionStatSchema = new mongoose.Schema(
  { label: { type: String, required: true }, value: { type: String, required: true } },
  { _id: false }
);

const businessPlanItemSchema = new mongoose.Schema(
  { label: { type: String, required: true }, value: { type: String, required: true } },
  { _id: false }
);

const fundUsageItemSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    description: { type: String, default: "" },
    estimatedCost: { type: Number, required: true },
  },
  { _id: false }
);

const expectedOutcomeSchema = new mongoose.Schema(
  { label: { type: String, required: true }, value: { type: String, required: true } },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    url: { type: String, required: true },
    category: {
      type: String,
      enum: ["Legal & Registration", "Financials", "Business Plan", "Pitch Deck", "Product", "Other"],
      default: "Other",
    },
    fileSize: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const verificationRequestSchema = new mongoose.Schema({
  type: { type: String, enum: ["founder", "business"], required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  documents: [{ name: { type: String, required: true }, url: { type: String, required: true } }],
  note: { type: String, default: "" },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewNote: { type: String, default: "" },
});

const startupSchema = new mongoose.Schema(
  {
    founder: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    logo: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    industry: { type: String, required: true },
    subIndustry: { type: String, default: "" },
    stage: {
      type: String,
      enum: ["idea", "pre_seed", "seed", "series_a", "series_b", "growth"],
      default: "idea",
    },
    location: { type: String, required: true },
    incorporationType: { type: String, default: "" },
    registrationNumber: { type: String, default: "" },
    foundedDate: { type: Date },
    problemStatement: { type: String, default: "" },
    solution: { type: String, default: "" },
    targetAudience: { type: String, default: "" },
    fundingNeeded: { type: Number, default: 0 },
    fundingRaised: { type: Number, default: 0 },
    fundingType: [{ type: String }],
    investmentType: { type: String, default: "" },
    minimumInvestment: { type: Number, default: 0 },
    fundingDurationMonths: { type: Number, default: 0 },
    expectedClosingDate: { type: Date },
    fundUsagePlan: [fundUsageItemSchema],
    expectedOutcomes: [expectedOutcomeSchema],
    whyInvest: [{ type: String }],
    team: [teamMemberSchema],
    openRoles: [openRoleSchema],
    milestones: [milestoneSchema],
    missionStatement: { type: String, default: "" },
    highlights: [{ type: String }],
    tractionStats: [tractionStatSchema],
    businessPlan: [businessPlanItemSchema],
    products: [productSchema],
    productHighlights: [{ type: String }],
    howItWorks: [processStepSchema],
    planPhases: [planPhaseSchema],
    marketStats: [marketStatSchema],
    competitiveAdvantage: [{ type: String }],
    whyProduct: [{ type: String }],
    website: { type: String, default: "" },
    pitchDeckUrl: { type: String, default: "" },
    documents: [documentSchema],
    socialLinks: {
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    interested: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["draft", "pending_review", "published"], default: "draft" },
    // Two independent verification tiers, since idea-stage startups have no
    // registered business to check: founderVerified only confirms the founder's
    // identity is real; isVerified additionally confirms the business registration.
    founderVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    // Evidence submitted by the founder to support the founderVerified/isVerified
    // toggles above — never selected in public queries (contains ID/registration
    // document URLs), only visible to the owning founder and admins.
    verificationRequests: [verificationRequestSchema],
    isFeatured: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
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

startupSchema.index({ name: "text", tagline: "text", industry: "text" });

export default mongoose.model("Startup", startupSchema);
