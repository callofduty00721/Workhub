import { z } from "zod";
import { JOB_TYPE_VALUES, JOB_CATEGORY_VALUES, EXPERIENCE_LEVEL_VALUES, COMPANY_TYPE_VALUES, VISIBILITY_VALUES_EXPORT } from "./job.model.js";
import { nonNegativeNumber, nonNegativeInt, objectIdString, searchQueryString, queryNumber } from "../../validation/common.js";

// Several of these accept a comma-separated list of values (see
// listJobs' own `String(x).includes(",") ? { $in: ... } : x` handling) — the
// schema only needs to bound it as a real string, the comma-split parsing
// stays in the controller since it produces the actual Mongo $in clause.
const commaListString = (max) => z.string().trim().max(max).optional();

export const listJobsQuerySchema = z.object({
  search: searchQueryString(),
  type: commaListString(200),
  category: commaListString(500),
  isRemote: z.enum(["true", "false"]).optional(),
  employer: objectIdString("employer").optional(),
  excludeId: objectIdString("excludeId").optional(),
  salaryMin: queryNumber(),
  salaryMax: queryNumber(),
  industryType: commaListString(500),
  subIndustry: commaListString(500),
  qualification: searchQueryString(),
  companyType: commaListString(200),
});

const attachmentSchema = z.object({ key: z.string().min(1).max(512), name: z.string().max(255).optional() }).strict();

// Matches PostJob.tsx's own form schema field-for-field (that one is UX
// validation only — this is the real boundary). `status` IS listed here
// since the frontend genuinely sends it on every save (see PostJob.tsx's
// mutation payload) — but `applicationsCount`, `viewsCount`, `reports`,
// `ndaAcceptances`, `employer`, `company` are NOT, and .strict() rejects any
// field outside this list rather than silently dropping it. That's what
// closes the mass-assignment gap the old `Job.create({ ...req.body, ... })`
// / `Object.assign(job, req.body)` had — those fields can never arrive via
// this body no matter what a client sends.
const baseJobShape = {
  title: z.string().trim().min(2).max(200),
  companyName: z.string().trim().min(2).max(200),
  description: z.string().trim().min(20).max(20000),
  responsibilities: z.string().max(20000).optional(),
  requirements: z.string().max(20000).optional(),
  type: z.enum(JOB_TYPE_VALUES).optional(),
  category: z.enum(JOB_CATEGORY_VALUES),
  experienceLevel: z.enum(EXPERIENCE_LEVEL_VALUES).optional(),
  role: z.string().max(200).optional(),
  // Not z.enum server-side either — same reasoning as the frontend schema:
  // the industry list is a large runtime-derived map, not worth hardcoding
  // twice; subIndustry's validity against it is a UX concern, not a
  // security one, since neither is used to construct a query/path.
  industryType: z.string().max(200).optional(),
  subIndustry: z.string().max(200).optional(),
  companyType: z.enum(COMPANY_TYPE_VALUES).optional().or(z.literal("")),
  department: z.string().max(200).optional(),
  roleCategory: z.string().max(200).optional(),
  educationUG: z.string().max(200).optional(),
  educationPG: z.string().max(200).optional(),
  openings: nonNegativeInt.optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  location: z.string().trim().min(2).max(200),
  isRemote: z.boolean().optional(),
  salaryMin: nonNegativeNumber.optional(),
  salaryMax: nonNegativeNumber.optional(),
  currency: z.enum(["INR", "USD"]).optional(),
  status: z.enum(["open", "closed", "draft"]).optional(),
  visibility: z.enum(VISIBILITY_VALUES_EXPORT).optional(),
  requiresNda: z.boolean().optional(),
  ndaText: z.string().max(20000).optional(),
  attachments: z.array(attachmentSchema).max(20).optional(),
};

const salaryRefine = (d) => d.salaryMin === undefined || d.salaryMax === undefined || d.salaryMax === 0 || d.salaryMax >= d.salaryMin;
const salaryRefineOpts = { message: "salaryMax must be greater than or equal to salaryMin", path: ["salaryMax"] };

export const createJobSchema = z.object(baseJobShape).strict().refine(salaryRefine, salaryRefineOpts);

// Same shape, but every field optional (a PUT can touch just one field) —
// title/companyName/description/category/location drop their "required"
// status here since an edit legitimately might only touch, say, `openings`.
export const updateJobSchema = z.object(baseJobShape).partial().strict().refine(salaryRefine, salaryRefineOpts);

export const inviteFreelancerSchema = z.object({ freelancerId: objectIdString("freelancerId") }).strict();

export const applyToJobSchema = z
  .object({
    coverLetter: z.string().max(10000).optional(),
    resumeUrl: z.string().trim().max(2048).optional(),
    proposedRate: nonNegativeNumber.optional(),
    deliveryDays: nonNegativeInt.optional(),
  })
  .strict();

export const editApplicationSchema = z
  .object({
    coverLetter: z.string().max(10000).optional(),
    proposedRate: nonNegativeNumber.optional(),
    deliveryDays: nonNegativeInt.optional(),
  })
  .strict();

export const requestRateChangeSchema = z
  .object({
    message: z.string().max(2000).optional(),
    suggestedRate: nonNegativeNumber.optional(),
  })
  .strict();

export const updateApplicationStatusSchema = z
  .object({ status: z.enum(["applied", "shortlisted", "interview", "rejected", "hired", "withdrawn"]) })
  .strict();

export const scheduleInterviewSchema = z
  .object({
    scheduledAt: z.coerce.date(),
    mode: z.enum(["video", "in_person", "phone"]).optional(),
    meetingLink: z.string().trim().max(2048).optional(),
    location: z.string().max(500).optional(),
    note: z.string().max(2000).optional(),
  })
  .strict();

export const signContractSchema = z.object({ signatureName: z.string().trim().min(1).max(200) }).strict();

export const reportJobSchema = z.object({ reason: z.string().max(2000).optional() }).strict();
