import { z } from "zod";
import {
  INVESTOR_TYPE_VALUES_EXPORT as INVESTOR_TYPE_VALUES,
  MENTOR_CATEGORY_VALUES_EXPORT as MENTOR_CATEGORY_VALUES,
  PARTNER_TYPE_VALUES,
  PARTNERSHIP_TYPE_VALUES_EXPORT as PARTNERSHIP_TYPE_VALUES,
  STARTUP_STAGE_VALUES_EXPORT as STARTUP_STAGE_VALUES,
  FOUNDER_STAGE_VALUES_EXPORT as FOUNDER_STAGE_VALUES,
  LANGUAGE_LEVEL_VALUES,
  AGENCY_SERVICE_VALUES_EXPORT as AGENCY_SERVICE_VALUES,
} from "./user.model.js";
import { nonNegativeNumber, nonNegativeInt, urlOptional } from "../../validation/common.js";

const str = (max) => z.string().trim().max(max).optional();
const strList = (max, itemMax = 200) => z.array(z.string().trim().max(itemMax)).max(max).optional();

// --- Reusable sub-shapes, mirroring the Mongoose sub-schemas in user.model.js ---

const socialLinkSchema = z.object({ platform: z.string().trim().min(1).max(60), url: z.string().trim().max(2048) }).strict();

const collaborationSchema = z
  .object({
    brandName: z.string().trim().min(1).max(200),
    description: str(2000),
    resultMetric: str(200),
    logoUrl: str(2048),
  })
  .strict();

const portfolioItemSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: str(5000),
    images: strList(20, 2048),
    video: str(2048),
    pdf: str(2048),
    websiteLink: str(2048),
    githubLink: str(2048),
    liveDemoLink: str(2048),
    tags: strList(30, 60),
    clientName: str(200),
    projectRole: str(200),
    // Never trusted from the client — sanitizePortfolioItems (user.controller.js)
    // always re-derives this against the freelancer's own paid+released
    // Payment records after this schema runs, so whatever's accepted here is
    // just a type placeholder, not the value that ends up stored.
    verifiedPayment: z.string().max(64).nullable().optional(),
  })
  .strict();

const payoutDetailsSchema = z
  .object({
    preferredMethod: z.enum(["upi", "bank"]).optional(),
    upiId: str(100),
    bankAccountNumber: str(34),
    bankIfsc: str(11),
    bankAccountHolder: str(200),
  })
  .strict();

const jobSeekerProfileSchema = z
  .object({
    desiredRole: str(200),
    expectedSalary: nonNegativeNumber.optional(),
    noticePeriodDays: nonNegativeInt.optional(),
    preferredLocations: strList(20, 200),
    willingToRelocate: z.boolean().optional(),
  })
  .strict();

const influencerPlatformSchema = z
  .object({
    platform: z.string().trim().min(1).max(60),
    handle: str(200),
    followers: nonNegativeInt.optional(),
    url: str(2048),
  })
  .strict();

const influencerRateSchema = z
  .object({
    platform: z.string().trim().min(1).max(60),
    contentType: z.string().trim().min(1).max(100),
    priceInInr: nonNegativeNumber,
  })
  .strict();

const influencerContentSampleSchema = z
  .object({ url: z.string().trim().min(1).max(2048), caption: str(1000), thumbnailUrl: str(2048) })
  .strict();

const influencerLanguageSchema = z
  .object({ name: z.string().trim().min(1).max(100), level: z.enum(LANGUAGE_LEVEL_VALUES).optional() })
  .strict();

const influencerProfileSchema = z
  .object({
    category: str(200),
    niche: str(200),
    mediaKitUrl: str(2048),
    platforms: z.array(influencerPlatformSchema).max(30).optional(),
    rateCard: z.array(influencerRateSchema).max(60).optional(),
    pastCollaborations: z.array(collaborationSchema).max(100).optional(),
    contentSamples: z.array(influencerContentSampleSchema).max(60).optional(),
    languages: z.array(influencerLanguageSchema).max(20).optional(),
  })
  .strict();

const brandProductSchema = z.object({ name: z.string().trim().min(1).max(200), description: str(2000), imageUrl: str(2048) }).strict();

const influencerRequirementSchema = z
  .object({
    category: str(200),
    minFollowers: nonNegativeInt.optional(),
    platforms: strList(20, 60),
    location: str(200),
    notes: str(2000),
  })
  .strict();

const brandProfileSchema = z
  .object({
    industry: str(200),
    categories: strList(30, 100),
    website: str(2048),
    socialLinks: z.array(socialLinkSchema).max(20).optional(),
    followerCount: nonNegativeInt.optional(),
    products: z.array(brandProductSchema).max(100).optional(),
    influencerRequirements: z.array(influencerRequirementSchema).max(30).optional(),
    pastCollaborations: z.array(collaborationSchema).max(100).optional(),
  })
  .strict();

const partnerClientSchema = z
  .object({ clientName: z.string().trim().min(1).max(200), logoUrl: str(2048), description: str(2000) })
  .strict();

const agencyProfileSchema = z
  .object({
    agencyType: str(200),
    website: str(2048),
    socialLinks: z.array(socialLinkSchema).max(20).optional(),
    teamSize: nonNegativeInt.optional(),
    services: z.array(z.enum(AGENCY_SERVICE_VALUES)).max(20).optional(),
    clients: z.array(partnerClientSchema).max(100).optional(),
    pastCampaigns: z.array(collaborationSchema).max(100).optional(),
  })
  .strict();

const talentPartnerProfileSchema = z
  .object({
    partnerType: str(100),
    website: str(2048),
    socialLinks: z.array(socialLinkSchema).max(20).optional(),
    services: strList(30, 200),
    brandPartnerships: z.array(partnerClientSchema).max(100).optional(),
  })
  .strict();

const experienceSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    company: z.string().trim().min(1).max(200),
    location: str(200),
    startLabel: str(60),
    endLabel: str(60),
    description: str(5000),
  })
  .strict();

const educationEntrySchema = z
  .object({
    degree: z.string().trim().min(1).max(200),
    institution: z.string().trim().min(1).max(200),
    startLabel: str(60),
    endLabel: str(60),
  })
  .strict();

const achievementSchema = z
  .object({ title: z.string().trim().min(1).max(200), description: str(2000), dateLabel: str(60) })
  .strict();

// --- The endpoint's actual body shape: every key here is exactly
// EDITABLE_FIELDS in user.controller.js — .strict() means a request field
// outside this exact list is a 400, not a silently-ignored no-op, so
// "editable" is enforced by the schema itself now, not just by which keys
// the for-loop happens to read. ---
export const updateMyProfileSchema = z
  .object({
    avatar: str(2048),
    coverImage: str(2048),
    headline: str(300),
    location: str(200),
    bio: str(10000),
    category: str(200),
    subCategory: str(200),
    skills: strList(100, 60),
    hourlyRate: nonNegativeNumber.optional(),
    yearsOfExperience: nonNegativeNumber.optional(),
    availabilityStatus: z.enum(["available", "busy"]).optional(),
    hoursPerWeekAvailable: nonNegativeNumber.optional(),
    workingDays: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])).max(7).optional(),
    workingHours: str(200),
    totalHoursWorked: nonNegativeNumber.optional(),
    responseTimeLabel: str(100),
    phone: z
      .string()
      .regex(/^\d{10}$/, "Enter a valid 10-digit phone number")
      .optional()
      .or(z.literal("")),
    resumeUrl: urlOptional,
    videoIntro: str(2048),
    portfolioItems: z.array(portfolioItemSchema).max(100).optional(),
    payoutDetails: payoutDetailsSchema.optional(),
    investorType: z.enum(INVESTOR_TYPE_VALUES).optional(),
    mentorCategory: z.enum(MENTOR_CATEGORY_VALUES).optional(),
    investmentFocus: strList(50, 100),
    ticketSizeMin: nonNegativeNumber.optional(),
    ticketSizeMax: nonNegativeNumber.optional(),
    portfolioCompanyCount: nonNegativeInt.optional(),
    fundName: str(200),
    fundSize: nonNegativeNumber.optional(),
    preferredStages: z.array(z.enum(STARTUP_STAGE_VALUES)).max(STARTUP_STAGE_VALUES.length).optional(),
    expertise: strList(50, 100),
    sessionRate: nonNegativeNumber.optional(),
    sessionFormat: z.enum(["video", "chat", "in_person"]).optional(),
    organizationName: str(200),
    partnerType: z.enum(PARTNER_TYPE_VALUES).optional(),
    services: strList(50, 200),
    teamSize: nonNegativeInt.optional(),
    yearsInBusiness: nonNegativeInt.optional(),
    projectsCompleted: nonNegativeInt.optional(),
    clientsServed: nonNegativeInt.optional(),
    partnershipTypes: z.array(z.enum(PARTNERSHIP_TYPE_VALUES)).max(PARTNERSHIP_TYPE_VALUES.length).optional(),
    programDetails: str(10000),
    startupsSupportedCount: nonNegativeInt.optional(),
    applicationLink: urlOptional,
    companyName: str(200),
    companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "500+", ""]).optional(),
    companyRegistrationNumber: str(100),
    linkedIn: urlOptional,
    industries: strList(50, 200),
    pastStartupsCount: nonNegativeInt.optional(),
    experience: z.array(experienceSchema).max(50).optional(),
    education: z.array(educationEntrySchema).max(50).optional(),
    achievements: z.array(achievementSchema).max(50).optional(),
    languages: strList(30, 100),
    dateOfBirth: z.coerce.date().optional(),
    nationality: str(100),
    educationLevel: str(200),
    roleTags: strList(20, 100),
    lookingFor: strList(20, 100),
    socialLinks: z.object({ twitter: str(2048), github: str(2048), website: str(2048) }).strict().optional(),
    jobSeekerProfile: jobSeekerProfileSchema.optional(),
    influencerProfile: influencerProfileSchema.optional(),
    brandProfile: brandProfileSchema.optional(),
    agencyProfile: agencyProfileSchema.optional(),
    talentPartnerProfile: talentPartnerProfileSchema.optional(),
    founderStage: z.enum(FOUNDER_STAGE_VALUES).optional(),
  })
  .strict();
