import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const ROLES = [
  "super_admin",
  "founder",
  "freelancer",
  "employer",
  "investor",
  "mentor",
  "partner",
  "client",
];

const PARTNER_TYPES = ["accelerator", "incubator", "government", "ngo", "service_provider"];

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
    image: { type: String, default: "" },
    link: { type: String, default: "" },
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
    role: { type: String, enum: ROLES, default: "freelancer" },
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

    // KYC — required before a freelancer can withdraw real money
    kycStatus: { type: String, enum: ["unverified", "pending", "verified", "rejected"], default: "unverified" },
    kycDocuments: [{ url: { type: String, required: true }, name: { type: String, required: true } }],
    kycSubmittedAt: { type: Date },
    kycReviewNote: { type: String, default: "" },

    // Analytics
    profileViews: { type: Number, default: 0 },

    // Investor
    investmentFocus: [{ type: String }],
    ticketSizeMin: { type: Number, default: 0 },
    ticketSizeMax: { type: Number, default: 0 },
    portfolioCompanyCount: { type: Number, default: 0 },

    // Mentor
    expertise: [{ type: String }],
    sessionRate: { type: Number, default: 0 },

    // Partner
    organizationName: { type: String, default: "" },
    partnerType: { type: String, enum: PARTNER_TYPES, default: "service_provider" },

    // Client
    companyName: { type: String, default: "" },

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
    expertise,
    sessionRate,
    organizationName,
    partnerType,
    companyName,
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
    profileViews,
    savedJobs,
    savedProjects,
    referralCode,
    referralBonusBalance,
    referralBonusTotal,
    savedServices,
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
    expertise,
    sessionRate,
    organizationName,
    partnerType,
    companyName,
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
    profileViews,
    savedJobs,
    savedProjects,
    referralCode,
    referralBonusBalance,
    referralBonusTotal,
    savedServices,
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
