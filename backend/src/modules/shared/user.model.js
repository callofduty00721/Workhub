import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const ROLES = [
  "super_admin",
  "founder",
  "freelancer",
  "job_seeker",
  "influencer",
  "employer",
  "investor",
  "mentor",
  "partner",
  "client",
];

const PARTNER_TYPES = ["accelerator", "incubator", "government", "ngo", "service_provider"];

// Mirrors Startup.js's stage enum — an investor's "preferred stages" filter
// options should always match what a startup can actually be, so keep in sync.
const STARTUP_STAGE_VALUES = ["idea", "pre_seed", "seed", "series_a", "series_b", "growth"];

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

const influencerCollaborationSchema = new mongoose.Schema(
  {
    brandName: { type: String, required: true },
    description: { type: String, default: "" },
    resultMetric: { type: String, default: "" },
  },
  { _id: false }
);

const influencerContentSampleSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: { type: String, default: "" },
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
    avgEngagementRate: { type: Number, default: 0 },
    platforms: [influencerPlatformSchema],
    rateCard: [influencerRateSchema],
    pastCollaborations: [influencerCollaborationSchema],
    contentSamples: [influencerContentSampleSchema],
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
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 8, select: false },
    googleId: { type: String, select: false },
    // `role` is the single ACTIVE role — every existing authorize(...) check in
    // the app keeps working unmodified against it. `roles` is the set of roles
    // the user has added within `selectedCategory`; switchRole() (roleController)
    // just repoints `role` at one of them.
    role: { type: String, enum: ROLES, default: null },
    roles: [{ type: String, enum: ROLES }],
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

    // KYC — required before a freelancer can withdraw real money
    kycStatus: { type: String, enum: ["unverified", "pending", "verified", "rejected"], default: "unverified" },
    kycDocuments: [{ url: { type: String, required: true }, name: { type: String, required: true } }],
    kycSubmittedAt: { type: Date },
    kycReviewNote: { type: String, default: "" },

    // Mobile verification — via whichever provider PlatformSettings.phoneAuthProvider
    // points at (Firebase or Twilio); see user.controller.js's sendPhoneOtp/
    // verifyPhoneOtp/verifyPhoneFirebaseToken. No OTP state is stored here —
    // both providers own their own verification state.
    isPhoneVerified: { type: Boolean, default: false },

    // Face / Address / Bank verification — same submit-then-admin-review
    // shape as kycStatus above, just against a different document/selfie.
    faceVerificationStatus: { type: String, enum: ["unverified", "pending", "verified", "rejected"], default: "unverified" },
    faceVerificationSelfie: { type: String, default: "" },
    faceVerificationSubmittedAt: { type: Date },
    faceVerificationReviewNote: { type: String, default: "" },

    addressVerificationStatus: { type: String, enum: ["unverified", "pending", "verified", "rejected"], default: "unverified" },
    addressVerificationDocuments: [{ url: { type: String, required: true }, name: { type: String, required: true } }],
    addressVerificationSubmittedAt: { type: Date },
    addressVerificationReviewNote: { type: String, default: "" },

    bankVerificationStatus: { type: String, enum: ["unverified", "pending", "verified", "rejected"], default: "unverified" },
    bankVerificationDocuments: [{ url: { type: String, required: true }, name: { type: String, required: true } }],
    bankVerificationSubmittedAt: { type: Date },
    bankVerificationReviewNote: { type: String, default: "" },

    // Analytics
    profileViews: { type: Number, default: 0 },

    // Investor
    investmentFocus: [{ type: String }],
    ticketSizeMin: { type: Number, default: 0 },
    ticketSizeMax: { type: Number, default: 0 },
    portfolioCompanyCount: { type: Number, default: 0 },
    fundName: { type: String, default: "" },
    fundSize: { type: Number, default: 0 },
    preferredStages: [{ type: String, enum: STARTUP_STAGE_VALUES }],

    // Mentor — availability reuses hoursPerWeekAvailable/workingDays/workingHours,
    // already defined above for freelancers; sessionFormat is mentor-only.
    expertise: [{ type: String }],
    sessionRate: { type: Number, default: 0 },
    sessionFormat: { type: String, enum: ["video", "chat", "in_person"], default: "video" },

    // Partner
    organizationName: { type: String, default: "" },
    partnerType: { type: String, enum: PARTNER_TYPES, default: "service_provider" },
    programDetails: { type: String, default: "" },
    startupsSupportedCount: { type: Number, default: 0 },
    applicationLink: { type: String, default: "" },

    // Client
    companyName: { type: String, default: "" },
    companySize: { type: String, enum: ["1-10", "11-50", "51-200", "201-500", "500+", ""], default: "" },
    companyRegistrationNumber: { type: String, default: "" },

    // Employer — the Company (team account) this user belongs to, if any. Distinct
    // from `companyName` above (a free-text display label used by Client accounts).
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },

    // Founder
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

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) return next();
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
    selectedCategory,
    jobSeekerProfile,
    influencerProfile,
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
    investmentFocus,
    ticketSizeMin,
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
    selectedCategory,
    jobSeekerProfile,
    influencerProfile,
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
    investmentFocus,
    ticketSizeMin,
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
    lastActiveAt,
    isEmailVerified,
    isProfileComplete,
    emailNotificationsEnabled,
    createdAt,
  };
};

export const ROLE_VALUES = ROLES;
export const PARTNER_TYPE_VALUES = PARTNER_TYPES;
export default mongoose.model("User", userSchema);
