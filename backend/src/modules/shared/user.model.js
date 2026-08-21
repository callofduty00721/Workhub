import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const ROLES = [
  "super_admin",
  "staff",
  "founder",
  "freelancer",
  "job_seeker",
  "influencer",
  "employer",
  "investor",
  "mentor",
  "partner",
  "client",
  "brand",
  "agency",
  "talent_partner",
];

// Delegable slices of the admin panel a "staff" account can be scoped to —
// deliberately excludes anything that moves money (withdrawals, payment
// disputes) or changes global config (settings, plans) or another account's
// identity (users) — those stay super_admin-only no matter what a staff
// account's permissions array contains. See middleware/auth.js's
// requirePermission and admin.routes.js for where this is enforced.
const PERMISSIONS = [
  "grievances",
  "kyc",
  "profile-verifications",
  "role-verifications",
  "flagged-startups",
  "startups",
  "jobs",
  "gigs",
  "contests",
  "skill-tests",
  "reviews",
  "referrals",
  "campaigns",
];

// B2B agency/service-provider categories — a "partner" here means a
// business GrowHive users can collaborate with (agency, consultant, tech
// vendor...), not a startup-support program. Zero real partner accounts
// exist yet, so this enum was safe to redefine outright rather than migrate.
const PARTNER_TYPES = ["agency", "company", "consultant", "service_provider", "technology_partner", "strategic_partner"];

const PARTNERSHIP_TYPE_VALUES = ["service", "referral", "technology", "strategic", "distribution"];

// Mirrors Startup.js's stage enum — an investor's "preferred stages" filter
// options should always match what a startup can actually be, so keep in sync.
const STARTUP_STAGE_VALUES = ["idea", "pre_seed", "seed", "series_a", "series_b", "growth"];

const INVESTOR_TYPE_VALUES = ["angel", "venture_capital", "private_equity", "family_office", "strategic"];

const MENTOR_CATEGORY_VALUES = ["startup", "business", "career", "technology", "marketing", "finance", "leadership", "design"];

const CATEGORY_VALUES = ["talent", "hiring", "startup"];
const VERIFICATION_STATUS_VALUES = ["unverified", "pending", "verified", "rejected"];
const FOUNDER_STAGE_VALUES = ["idea", "registered"];

// Both new "talent" roles get a small embedded profile, created on demand by
// roleController.addRoles (not defaulted here) so a role that was never added
// leaves no trace on the document — see the "don't overwrite" rule in addRoles.
const jobSeekerProfileSchema = new mongoose.Schema(
  {
    desiredRole: { type: String, default: "" },
    expectedSalary: { type: Number, default: 0 },
    noticePeriodDays: { type: Number, default: 0 },
    preferredLocations: [{ type: String }],
    willingToRelocate: { type: Boolean, default: false },
  },
  { _id: false }
);

const influencerPlatformSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true },
    handle: { type: String, default: "" },
    followers: { type: Number, default: 0 },
    url: { type: String, default: "" },
  },
  { _id: false }
);

// One rate per (platform, content type) — e.g. Instagram/Reel, Instagram/Story
// — since an influencer's price naturally varies by both, not just platform.
const influencerRateSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true },
    contentType: { type: String, required: true },
    priceInInr: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Shared by Influencer's "Past Collaborations", Brand's "Past
// Collaborations", and Agency's "Past Campaigns" — same free-text showcase
// shape everywhere it's used.
const influencerCollaborationSchema = new mongoose.Schema(
  {
    brandName: { type: String, required: true },
    description: { type: String, default: "" },
    resultMetric: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
  },
  { _id: false }
);

const influencerContentSampleSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: { type: String, default: "" },
    // Uploaded by the influencer themselves (see upload.controller.js's
    // "content_thumbnail" folder) — not auto-fetched from Instagram/YouTube,
    // so it needs no API integration and can't silently go stale/broken.
    thumbnailUrl: { type: String, default: "" },
  },
  { _id: false }
);

const LANGUAGE_LEVELS = ["beginner", "conversational", "fluent", "native"];

// Self-reported, same trust level as everything else on this schema (rate
// card, past collaborations) — not verified, but distinct from the removed
// engagement-rate metric since there's no meaningful way to "verify" a
// language claim anyway; a brand reads it as a claim, not a platform stat.
const influencerLanguageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    level: { type: String, enum: LANGUAGE_LEVELS, default: "fluent" },
  },
  { _id: false }
);

const influencerProfileSchema = new mongoose.Schema(
  {
    // Top-level content category (Education, Technology, Food & Cooking...) —
    // `niche` stays the more specific value within it (e.g. "Gadget Reviews"
    // under "Technology"). Both plain strings, validated against
    // frontend/src/lib/mockData.ts's INFLUENCER_CATEGORIES on the client only
    // (same pattern as freelancer category/subCategory) — no backend enum, so
    // the taxonomy can change without a migration.
    category: { type: String, default: "" },
    niche: { type: String, default: "" },
    mediaKitUrl: { type: String, default: "" },
    platforms: [influencerPlatformSchema],
    rateCard: [influencerRateSchema],
    pastCollaborations: [influencerCollaborationSchema],
    contentSamples: [influencerContentSampleSchema],
    languages: [influencerLanguageSchema],
  },
  { _id: false }
);

const brandProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
  },
  { _id: false }
);

// A brand's standing ask, shown on its "Influencer Requirements" tab — not
// tied to any one live Campaign, just a general brief for who they typically
// want to hear from.
const influencerRequirementSchema = new mongoose.Schema(
  {
    category: { type: String, default: "" },
    minFollowers: { type: Number, default: 0 },
    platforms: [{ type: String }],
    location: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

// A brand/agency/talent-partner's own marketing handles — deliberately a
// free-form list (platform name + URL), not fixed fields like
// instagramUrl/youtubeUrl, so a new platform never needs a schema change to
// add. Same idea as influencerPlatformSchema, and separate from the generic
// top-level socialLinks (twitter/github/website — a professional-network
// set shared by every role) since that shape doesn't fit Instagram/YouTube.
const profileSocialLinkSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const brandProfileSchema = new mongoose.Schema(
  {
    industry: { type: String, default: "" },
    // Multiple content categories the brand works across (e.g. "Skincare",
    // "Haircare") — distinct from the single `industry` classification.
    categories: [{ type: String }],
    website: { type: String, default: "" },
    socialLinks: [profileSocialLinkSchema],
    followerCount: { type: Number, default: 0 },
    products: [brandProductSchema],
    influencerRequirements: [influencerRequirementSchema],
    // Same free-text shape as influencerCollaborationSchema — a showcase, not
    // a consent-gated relationship (contrast talentRoster.model.js's
    // consent-gated "Our Creators", which is for a different kind of claim).
    pastCollaborations: [influencerCollaborationSchema],
  },
  { _id: false }
);

const AGENCY_SERVICE_VALUES = [
  "influencer_marketing",
  "social_media_marketing",
  "performance_marketing",
  "brand_campaigns",
  "ugc",
  "content_production",
  "pr",
];

// Shared by Agency's "Clients" tab and Talent Partner's "Brand Partnerships"
// tab — both are a free-text showcase of who they've worked with, same shape
// as influencerCollaborationSchema. Deliberately NOT consent-gated: unlike
// claiming to represent a specific creator (talentRoster.model.js), naming a
// past client relationship doesn't put words in that client's mouth the way
// listing someone as "our creator" would.
const partnerClientSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    logoUrl: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const agencyProfileSchema = new mongoose.Schema(
  {
    agencyType: { type: String, default: "" },
    website: { type: String, default: "" },
    socialLinks: [profileSocialLinkSchema],
    teamSize: { type: Number, default: 0 },
    services: [{ type: String, enum: AGENCY_SERVICE_VALUES }],
    clients: [partnerClientSchema],
    pastCampaigns: [influencerCollaborationSchema],
  },
  { _id: false }
);

const talentPartnerProfileSchema = new mongoose.Schema(
  {
    // Display label only ("Talent Manager" / "Agency") — not the account
    // role itself, which stays "talent_partner" everywhere else.
    partnerType: { type: String, default: "" },
    website: { type: String, default: "" },
    socialLinks: [profileSocialLinkSchema],
    services: [{ type: String }],
    brandPartnerships: [partnerClientSchema],
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: "" },
    startLabel: { type: String, default: "" },
    endLabel: { type: String, default: "Present" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const educationEntrySchema = new mongoose.Schema(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    startLabel: { type: String, default: "" },
    endLabel: { type: String, default: "" },
  },
  { _id: false }
);

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dateLabel: { type: String, default: "" },
  },
  { _id: false }
);

const portfolioItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    images: [{ type: String }],
    video: { type: String, default: "" },
    pdf: { type: String, default: "" },
    websiteLink: { type: String, default: "" },
    githubLink: { type: String, default: "" },
    liveDemoLink: { type: String, default: "" },
    tags: [{ type: String }],
    clientName: { type: String, default: "" },
    projectRole: { type: String, default: "" },
    // Set only via the verified-payment picker in updateMyProfile, which checks
    // the payment actually belongs to this freelancer and was paid+released —
    // never trust a raw id copied straight from the request body.
    verifiedPayment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Optional now — a phone-verified account (see auth.controller.js's
    // register()/verifyPhoneRegisterOtp) can exist with no email at all.
    // `sparse` lets any number of docs omit it without tripping the unique index.
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, minlength: 8, select: false },
    googleId: { type: String, select: false },
    // `role` is the single ACTIVE role — every existing authorize(...) check in
    // the app keeps working unmodified against it. `roles` is the set of roles
    // the user has added within `selectedCategory`; switchRole() (roleController)
    // just repoints `role` at one of them.
    role: { type: String, enum: ROLES, default: null },
    roles: [{ type: String, enum: ROLES }],
    // Set only by scripts/seed/seedDemoContent.js — lets profile cards show a
    // "Demo" badge on seeded accounts instead of passing them off as real,
    // since the platform has no real users yet.
    isDemo: { type: Boolean, default: false },
    // Only meaningful when role === "staff" — which admin-panel sections a
    // super_admin-created staff account can access (see requirePermission).
    // A super_admin account ignores this entirely; it always has full access.
    staffPermissions: [{ type: String, enum: PERMISSIONS }],
    selectedCategory: { type: String, enum: CATEGORY_VALUES, default: null },
    avatar: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    headline: { type: String, default: "" },
    location: { type: String, default: "" },
    bio: { type: String, default: "" },

    // Freelancer
    category: { type: String, default: "" },
    subCategory: { type: String, default: "" },
    skills: [{ type: String }],
    hourlyRate: { type: Number, default: 0 },
    yearsOfExperience: { type: Number, default: 0 },
    availabilityStatus: { type: String, enum: ["available", "busy"], default: "available" },
    hoursPerWeekAvailable: { type: Number, default: 0 },
    workingDays: [{ type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }],
    workingHours: { type: String, default: "" },
    // Cached copy of the level computed in utils/freelancerLevel.js — refreshed
    // on escrow release / dispute resolution, not on every read, so it can be
    // filtered on cheaply in freelancer list/search queries.
    level: { type: String, enum: ["new", "level_1", "top_rated"], default: "new" },
    // Self-reported trust signals a freelancer fills in themselves (like
    // yearsOfExperience above) — not independently verified by the platform.
    totalHoursWorked: { type: Number, default: 0 },
    onTimeDeliveryPercent: { type: Number, default: 0, min: 0, max: 100 },
    responseTimeLabel: { type: String, default: "" },
    phone: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    resumeUpdatedAt: { type: Date },
    videoIntro: { type: String, default: "" },
    portfolioItems: [portfolioItemSchema],
    payoutDetails: {
      preferredMethod: { type: String, enum: ["upi", "bank"], default: "upi" },
      upiId: { type: String, default: "" },
      bankAccountNumber: { type: String, default: "" },
      bankIfsc: { type: String, default: "" },
      bankAccountHolder: { type: String, default: "" },
    },

    // Job seeker / Influencer — see jobSeekerProfileSchema/influencerProfileSchema
    // above for why these have no schema-level default.
    jobSeekerProfile: { type: jobSeekerProfileSchema },
    influencerProfile: { type: influencerProfileSchema },
    // Brand / Agency / Talent Partner — same lazy-init pattern (no
    // schema-level default), created on demand by roleController.addRoles.
    brandProfile: { type: brandProfileSchema },
    agencyProfile: { type: agencyProfileSchema },
    talentPartnerProfile: { type: talentPartnerProfileSchema },

    // Startup founder — 'idea' stage lets a founder look for a co-founder/team
    // freely; anything money- or employment-shaped (paid job post, investor
    // pitch) additionally requires isVerified via requireVerifiedForAction.
    founderStage: { type: String, enum: FOUNDER_STAGE_VALUES, default: "idea" },

    // Generic action-level verification (distinct from the freelancer-specific
    // kycStatus below) — gates high-risk actions like posting a paid job or
    // contacting a startup as an investor. See utils/roleCategories.js.
    isVerified: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: VERIFICATION_STATUS_VALUES, default: "unverified" },
    verificationDocuments: [{ url: { type: String, required: true }, name: { type: String, required: true } }],
    verificationSubmittedAt: { type: Date },
    verificationNote: { type: String, default: "" },

    // Running total of every file this user has ever uploaded (avatars, chat
    // attachments, deliverables, documents, ...) — checked against a flat quota
    // in upload.controller.js before any new upload is accepted. This is what
    // stops a user from sharing any more files, in chat or anywhere else, once
    // they're out of space.
    storageUsedBytes: { type: Number, default: 0 },

    // KYC — required before a freelancer can withdraw real money
    kycStatus: { type: String, enum: ["unverified", "pending", "verified", "rejected"], default: "unverified" },
    kycDocuments: [{ url: { type: String, required: true }, name: { type: String, required: true } }],
    kycSubmittedAt: { type: Date },
    kycReviewNote: { type: String, default: "" },
    // Which admin/staff account reviewed this — see admin/kyc.js's
    // reviewKyc/reviewProfileVerification and the Staff Activity Log page,
    // which is what this actually exists for (attributing a staff account's
    // scoped review actions, not just super_admin's).
    kycReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Mobile verification — via whichever provider PlatformSettings.phoneAuthProvider
    // points at (currently only Firebase); see user.controller.js's
    // verifyPhoneFirebaseToken. No OTP state is stored here — the provider
    // owns its own verification state.
    isPhoneVerified: { type: Boolean, default: false },

    // Face / Address / Bank verification — same submit-then-admin-review
    // shape as kycStatus above, just against a different document/selfie.
    faceVerificationStatus: { type: String, enum: ["unverified", "pending", "verified", "rejected"], default: "unverified" },
    faceVerificationSelfie: { type: String, default: "" },
    faceVerificationSubmittedAt: { type: Date },
    faceVerificationReviewNote: { type: String, default: "" },
    faceVerificationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    addressVerificationStatus: { type: String, enum: ["unverified", "pending", "verified", "rejected"], default: "unverified" },
    addressVerificationDocuments: [{ url: { type: String, required: true }, name: { type: String, required: true } }],
    addressVerificationSubmittedAt: { type: Date },
    addressVerificationReviewNote: { type: String, default: "" },
    addressVerificationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    bankVerificationStatus: { type: String, enum: ["unverified", "pending", "verified", "rejected"], default: "unverified" },
    bankVerificationDocuments: [{ url: { type: String, required: true }, name: { type: String, required: true } }],
    bankVerificationSubmittedAt: { type: Date },
    bankVerificationReviewNote: { type: String, default: "" },
    bankVerificationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Analytics
    profileViews: { type: Number, default: 0 },

    // Investor
    investorType: { type: String, enum: INVESTOR_TYPE_VALUES },
    investmentFocus: [{ type: String }],
    ticketSizeMin: { type: Number, default: 0 },
    ticketSizeMax: { type: Number, default: 0 },
    portfolioCompanyCount: { type: Number, default: 0 },
    fundName: { type: String, default: "" },
    fundSize: { type: Number, default: 0 },
    preferredStages: [{ type: String, enum: STARTUP_STAGE_VALUES }],

    // Mentor — availability reuses hoursPerWeekAvailable/workingDays/workingHours,
    // already defined above for freelancers; sessionFormat is mentor-only.
    mentorCategory: { type: String, enum: MENTOR_CATEGORY_VALUES },
    expertise: [{ type: String }],
    sessionRate: { type: Number, default: 0 },
    sessionFormat: { type: String, enum: ["video", "chat", "in_person"], default: "video" },

    // Partner
    organizationName: { type: String, default: "" },
    partnerType: { type: String, enum: PARTNER_TYPES, default: "service_provider" },
    services: [{ type: String }],
    teamSize: { type: Number, default: 0 },
    yearsInBusiness: { type: Number, default: 0 },
    projectsCompleted: { type: Number, default: 0 },
    clientsServed: { type: Number, default: 0 },
    partnershipTypes: [{ type: String, enum: PARTNERSHIP_TYPE_VALUES }],
    programDetails: { type: String, default: "" },
    startupsSupportedCount: { type: Number, default: 0 },
    applicationLink: { type: String, default: "" },

    // Client (companySize also reused by Partner — same enum, no meaningful
    // difference between "a client's company size" and "a partner's company
    // size", so no need for a duplicate field)
    companyName: { type: String, default: "" },
    companySize: { type: String, enum: ["1-10", "11-50", "51-200", "201-500", "500+", ""], default: "" },
    companyRegistrationNumber: { type: String, default: "" },

    // Employer — the Company (team account) this user belongs to, if any. Distinct
    // from `companyName` above (a free-text display label used by Client accounts).
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },

    // Founder (linkedIn/industries also reused by Partner — generic fields,
    // no meaningful role-specific difference)
    linkedIn: { type: String, default: "" },
    industries: [{ type: String }],
    pastStartupsCount: { type: Number, default: 0 },
    experience: [experienceSchema],
    education: [educationEntrySchema],
    achievements: [achievementSchema],
    languages: [{ type: String }],
    dateOfBirth: { type: Date },
    nationality: { type: String, default: "" },
    educationLevel: { type: String, default: "" },
    roleTags: [{ type: String }],
    lookingFor: [{ type: String }],
    socialLinks: {
      twitter: { type: String, default: "" },
      github: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    savedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    savedServices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
    savedFreelancers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedContests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Contest" }],
    // A hiring-side shortlist — brand/agency/talent_partner/employer/client
    // bookmarking an influencer before deciding whether to invite/hire them.
    savedInfluencers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // An influencer bookmarking a campaign before deciding whether to apply.
    savedCampaigns: [{ type: mongoose.Schema.Types.ObjectId, ref: "Campaign" }],
    // A founder bookmarking an investor before deciding whether to pitch them.
    savedInvestors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Bookmarking a mentor before deciding whether to book a session.
    savedMentors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Bookmarking a partner before deciding whether to reach out.
    savedPartners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Referral program — every user gets a code at creation; referredBy is set
    // once at signup if they arrived via someone else's code. Bonus balance is
    // a separate informational credit ledger, deliberately NOT folded into the
    // real-money withdrawal wallet (which is computed from Payment records) —
    // keeps this additive feature from touching the escrow/payout math.
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    referralBonusBalance: { type: Number, default: 0 },
    referralBonusTotal: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },

    // Aggregate rating (freelancers, mentors, services all roll up onto the user)
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },

    isProfileComplete: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    // Self-service, distinct from isBanned (admin-imposed) — a deactivated
    // account is blocked from logging in the same way, but only the account
    // owner can trigger it and it's reported separately in the admin panel.
    isDeactivated: { type: Boolean, default: false },
    emailNotificationsEnabled: { type: Boolean, default: true },
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// `role` alone (or as a compound prefix) is in almost every listing query in
// the app — marketplace browse, admin's "all super_admins", the freelancer
// directory — so it's the highest-value index here. `category` is the next
// most common secondary filter after role (see service.controller.js's
// listFreelancers), so a role+category compound serves that combined case
// too (Mongo can also use it for role-only queries via the index prefix).
userSchema.index({ role: 1, category: 1 });

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) return next();
  // Set by auth.controller.js's createVerifiedUser() — the password there
  // was already bcrypt-hashed before being embedded in a pending-signup JWT
  // ticket (so the ticket never carries a recoverable plaintext password),
  // so hashing it a second time here would break login entirely.
  if (this.$locals.skipPasswordHash) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre("save", async function assignReferralCode(next) {
  if (!this.isNew || this.referralCode) return next();
  const base = (this.name || "user").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "USER";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `${base}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await this.constructor.exists({ referralCode: candidate });
    if (!exists) {
      this.referralCode = candidate;
      break;
    }
  }
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.createEmailVerificationToken = function createEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationTokenHash = crypto.createHash("sha256").update(token).digest("hex");
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return token;
};

userSchema.methods.createResetPasswordToken = function createResetPasswordToken() {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetPasswordTokenHash = crypto.createHash("sha256").update(token).digest("hex");
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  return token;
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const {
    _id,
    name,
    email,
    role,
    roles,
    staffPermissions,
    selectedCategory,
    jobSeekerProfile,
    influencerProfile,
    brandProfile,
    agencyProfile,
    talentPartnerProfile,
    founderStage,
    isVerified,
    verificationStatus,
    verificationDocuments,
    verificationSubmittedAt,
    verificationNote,
    avatar,
    coverImage,
    headline,
    location,
    bio,
    category,
    subCategory,
    skills,
    hourlyRate,
    yearsOfExperience,
    availabilityStatus,
    hoursPerWeekAvailable,
    workingDays,
    workingHours,
    level,
    totalHoursWorked,
    onTimeDeliveryPercent,
    responseTimeLabel,
    phone,
    resumeUrl,
    resumeUpdatedAt,
    videoIntro,
    portfolioItems,
    payoutDetails,
    investorType,
    investmentFocus,
    ticketSizeMin,
    mentorCategory,
    services,
    teamSize,
    yearsInBusiness,
    projectsCompleted,
    clientsServed,
    partnershipTypes,
    ticketSizeMax,
    portfolioCompanyCount,
    fundName,
    fundSize,
    preferredStages,
    expertise,
    sessionRate,
    sessionFormat,
    organizationName,
    partnerType,
    programDetails,
    startupsSupportedCount,
    applicationLink,
    companyName,
    companySize,
    companyRegistrationNumber,
    company,
    linkedIn,
    industries,
    pastStartupsCount,
    experience,
    education,
    achievements,
    languages,
    dateOfBirth,
    nationality,
    educationLevel,
    roleTags,
    lookingFor,
    socialLinks,
    rating,
    reviewCount,
    kycStatus,
    kycDocuments,
    kycSubmittedAt,
    kycReviewNote,
    isPhoneVerified,
    faceVerificationStatus,
    faceVerificationSelfie,
    faceVerificationSubmittedAt,
    faceVerificationReviewNote,
    addressVerificationStatus,
    addressVerificationDocuments,
    addressVerificationSubmittedAt,
    addressVerificationReviewNote,
    bankVerificationStatus,
    bankVerificationDocuments,
    bankVerificationSubmittedAt,
    bankVerificationReviewNote,
    profileViews,
    savedJobs,
    savedProjects,
    referralCode,
    referralBonusBalance,
    referralBonusTotal,
    savedServices,
    savedFreelancers,
    savedContests,
    savedInfluencers,
    savedCampaigns,
    savedInvestors,
    savedMentors,
    savedPartners,
    lastActiveAt,
    isEmailVerified,
    isProfileComplete,
    emailNotificationsEnabled,
    createdAt,
  } = this;
  return {
    id: _id,
    name,
    email,
    role,
    roles,
    staffPermissions,
    selectedCategory,
    jobSeekerProfile,
    influencerProfile,
    brandProfile,
    agencyProfile,
    talentPartnerProfile,
    founderStage,
    isVerified,
    verificationStatus,
    verificationDocuments,
    verificationSubmittedAt,
    verificationNote,
    avatar,
    coverImage,
    headline,
    location,
    bio,
    category,
    subCategory,
    skills,
    hourlyRate,
    yearsOfExperience,
    availabilityStatus,
    hoursPerWeekAvailable,
    workingDays,
    workingHours,
    level,
    totalHoursWorked,
    onTimeDeliveryPercent,
    responseTimeLabel,
    phone,
    resumeUrl,
    resumeUpdatedAt,
    videoIntro,
    portfolioItems,
    payoutDetails,
    investorType,
    investmentFocus,
    ticketSizeMin,
    mentorCategory,
    services,
    teamSize,
    yearsInBusiness,
    projectsCompleted,
    clientsServed,
    partnershipTypes,
    ticketSizeMax,
    portfolioCompanyCount,
    fundName,
    fundSize,
    preferredStages,
    expertise,
    sessionRate,
    sessionFormat,
    organizationName,
    partnerType,
    programDetails,
    startupsSupportedCount,
    applicationLink,
    companyName,
    companySize,
    companyRegistrationNumber,
    company,
    linkedIn,
    industries,
    pastStartupsCount,
    experience,
    education,
    achievements,
    languages,
    dateOfBirth,
    nationality,
    educationLevel,
    roleTags,
    lookingFor,
    socialLinks,
    rating,
    reviewCount,
    kycStatus,
    kycDocuments,
    kycSubmittedAt,
    kycReviewNote,
    isPhoneVerified,
    faceVerificationStatus,
    faceVerificationSelfie,
    faceVerificationSubmittedAt,
    faceVerificationReviewNote,
    addressVerificationStatus,
    addressVerificationDocuments,
    addressVerificationSubmittedAt,
    addressVerificationReviewNote,
    bankVerificationStatus,
    bankVerificationDocuments,
    bankVerificationSubmittedAt,
    bankVerificationReviewNote,
    profileViews,
    savedJobs,
    savedProjects,
    referralCode,
    referralBonusBalance,
    referralBonusTotal,
    savedServices,
    savedFreelancers,
    savedContests,
    savedInfluencers,
    savedCampaigns,
    savedInvestors,
    savedMentors,
    savedPartners,
    lastActiveAt,
    isEmailVerified,
    isProfileComplete,
    emailNotificationsEnabled,
    createdAt,
  };
};

export const ROLE_VALUES = ROLES;
export const PERMISSION_VALUES = PERMISSIONS;
export const PARTNER_TYPE_VALUES = PARTNER_TYPES;
export const LANGUAGE_LEVEL_VALUES = LANGUAGE_LEVELS;
export const PARTNERSHIP_TYPE_VALUES_EXPORT = PARTNERSHIP_TYPE_VALUES;
export const STARTUP_STAGE_VALUES_EXPORT = STARTUP_STAGE_VALUES;
export const INVESTOR_TYPE_VALUES_EXPORT = INVESTOR_TYPE_VALUES;
export const MENTOR_CATEGORY_VALUES_EXPORT = MENTOR_CATEGORY_VALUES;
export const FOUNDER_STAGE_VALUES_EXPORT = FOUNDER_STAGE_VALUES;
export const AGENCY_SERVICE_VALUES_EXPORT = AGENCY_SERVICE_VALUES;
export default mongoose.model("User", userSchema);
