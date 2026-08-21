import { z } from "zod";
import { searchQueryString } from "../../validation/common.js";

const str = (max) => z.string().trim().max(max).optional();
const strList = (max, itemMax = 300) => z.array(z.string().trim().max(itemMax)).max(max).optional();

// industry/subIndustry/stage each accept a comma-separated list (see
// listStartups' own `String(x).split(",")` handling) — bounded as a plain
// string here, the same reasoning as job.validation.js's commaListString.
export const listStartupsQuerySchema = z.object({
  search: searchQueryString(),
  industry: str(500),
  subIndustry: str(500),
  stage: str(200),
  sort: z.enum(["newest", "funding", "rating"]).optional(),
});

const teamMemberSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    role: z.string().trim().min(1).max(200),
    bio: str(2000),
    linkedin: str(2048),
    avatar: str(2048),
    skills: strList(50, 60),
    joinedDate: z.coerce.date().optional(),
  })
  .strict();

const milestoneSchema = z
  .object({ title: z.string().trim().min(1).max(300), description: str(5000), date: z.coerce.date().optional() })
  .strict();

const productSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: str(5000),
    image: str(2048),
    images: strList(30, 2048),
    tag: str(100),
    tags: strList(30, 100),
    url: str(2048),
    price: str(100),
    status: z.enum(["live", "beta", "coming_soon"]).optional(),
    features: strList(50, 300),
  })
  .strict();

const planPhaseSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    timeframe: str(100),
    checklist: strList(50, 300),
    estimatedCost: z.number().min(0).optional(),
  })
  .strict();

const labelValueSchema = z.object({ label: z.string().trim().min(1).max(300), value: z.string().trim().min(1).max(2000) }).strict();
const valueLabelSchema = z.object({ value: z.string().trim().min(1).max(2000), label: z.string().trim().min(1).max(300) }).strict();
const processStepSchema = z.object({ title: z.string().trim().min(1).max(300), description: str(5000) }).strict();

const openRoleSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    type: z.enum(["full_time", "part_time"]).optional(),
    workMode: z.enum(["on_site", "remote", "hybrid"]).optional(),
    description: str(10000),
    requiredSkills: strList(50, 60),
    requiredExperience: str(200),
    salary: str(100),
    responsibilities: strList(50, 500),
  })
  .strict();

const fundUsageItemSchema = z
  .object({ category: z.string().trim().min(1).max(200), description: str(2000), estimatedCost: z.number().min(0) })
  .strict();

const documentSchema = z
  .object({
    name: z.string().trim().min(1).max(300),
    description: str(2000),
    url: z.string().trim().min(1).max(2048),
    category: z.enum(["Legal & Registration", "Financials", "Business Plan", "Pitch Deck", "Product", "Other"]).optional(),
    fileSize: str(50),
    uploadedAt: z.coerce.date().optional(),
  })
  .strict();

// Matches startup.model.js's own field-for-field shape — every non-listed
// key (founder, followers, interested, status, founderVerified, isVerified,
// verificationRequests, isFeatured, isSuspended, rating, reviewCount,
// viewCount, reports, lastFlagReviewedBy/At) is server/admin-controlled and
// can never arrive through this body thanks to .strict(), closing the same
// `Startup.create({ ...req.body, ... })` / `Object.assign(startup,
// req.body)` mass-assignment gap job/project/campaign/contest had.
const baseStartupShape = {
  name: z.string().trim().min(1).max(200),
  tagline: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1).max(20000),
  logo: str(2048),
  coverImage: str(2048),
  industry: z.string().trim().min(1).max(200),
  subIndustry: str(200),
  stage: z.enum(["idea", "pre_seed", "seed", "series_a", "series_b", "growth"]).optional(),
  location: z.string().trim().min(1).max(200),
  incorporationType: str(200),
  registrationNumber: str(100),
  foundedDate: z.coerce.date().optional(),
  problemStatement: str(10000),
  solution: str(10000),
  targetAudience: str(2000),
  fundingNeeded: z.number().min(0).optional(),
  fundingRaised: z.number().min(0).optional(),
  fundingType: strList(20, 100),
  investmentType: str(200),
  minimumInvestment: z.number().min(0).optional(),
  fundingDurationMonths: z.number().min(0).optional(),
  expectedClosingDate: z.coerce.date().optional(),
  fundUsagePlan: z.array(fundUsageItemSchema).max(50).optional(),
  expectedOutcomes: z.array(valueLabelSchema).max(50).optional(),
  whyInvest: strList(30, 500),
  team: z.array(teamMemberSchema).max(50).optional(),
  openRoles: z.array(openRoleSchema).max(50).optional(),
  milestones: z.array(milestoneSchema).max(100).optional(),
  missionStatement: str(2000),
  highlights: strList(30, 300),
  tractionStats: z.array(labelValueSchema).max(30).optional(),
  businessPlan: z.array(labelValueSchema).max(50).optional(),
  products: z.array(productSchema).max(50).optional(),
  productHighlights: strList(30, 300),
  howItWorks: z.array(processStepSchema).max(30).optional(),
  planPhases: z.array(planPhaseSchema).max(30).optional(),
  marketStats: z.array(valueLabelSchema).max(30).optional(),
  competitiveAdvantage: strList(30, 500),
  whyProduct: strList(30, 500),
  website: str(2048),
  pitchDeckUrl: str(2048),
  documents: z.array(documentSchema).max(50).optional(),
  socialLinks: z
    .object({ linkedin: str(2048), twitter: str(2048), facebook: str(2048), instagram: str(2048) })
    .strict()
    .optional(),
  // CreateStartup.tsx sends this explicitly ("draft"/"published") on every
  // save — draft/publish is a real, legitimate self-service action here,
  // unlike Job/Campaign's status field which only ever needs "open".
  status: z.enum(["draft", "pending_review", "published"]).optional(),
};

export const createStartupSchema = z.object(baseStartupShape).strict();
export const updateStartupSchema = z.object(baseStartupShape).partial().strict();

export const submitVerificationRequestSchema = z
  .object({
    type: z.enum(["founder", "business"]),
    documents: z
      .array(z.object({ name: z.string().trim().min(1).max(300), url: z.string().trim().min(1).max(2048) }).strict())
      .min(1)
      .max(20),
    note: z.string().max(2000).optional(),
  })
  .strict();

export const reportStartupSchema = z.object({ reason: z.string().max(2000).optional() }).strict();
