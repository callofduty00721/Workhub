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
    portfolioItems: [portfolioItemSchema],

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
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
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
    portfolioItems,
    investmentFocus,
    ticketSizeMin,
    ticketSizeMax,
    portfolioCompanyCount,
    expertise,
    sessionRate,
    organizationName,
    partnerType,
    companyName,
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
    isEmailVerified,
    isProfileComplete,
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
    portfolioItems,
    investmentFocus,
    ticketSizeMin,
    ticketSizeMax,
    portfolioCompanyCount,
    expertise,
    sessionRate,
    organizationName,
    partnerType,
    companyName,
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
    isEmailVerified,
    isProfileComplete,
    createdAt,
  };
};

export const ROLE_VALUES = ROLES;
export const PARTNER_TYPE_VALUES = PARTNER_TYPES;
export default mongoose.model("User", userSchema);
