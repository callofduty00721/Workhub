import { z } from "zod";
import { PROJECT_TYPE_VALUES, PROJECT_VISIBILITY_VALUES } from "./project.model.js";
import { nonNegativeNumber, nonNegativeInt, objectIdString, searchQueryString } from "../../validation/common.js";

const attachmentSchema = z.object({ key: z.string().min(1).max(512), name: z.string().max(255).optional() }).strict();

// Matches PostProject.tsx's own form schema, same reasoning as
// job.validation.js: .strict() closes the mass-assignment gap the old
// `Project.create({ ...req.body, ... })` / `Object.assign(project,
// req.body)` had by rejecting anything outside this list (employer,
// company, applicationsCount, viewsCount, reports, ndaAcceptances can never
// arrive via this body).
const baseProjectShape = {
  title: z.string().trim().min(2).max(200),
  companyName: z.string().trim().min(2).max(200),
  description: z.string().trim().min(20).max(20000),
  requirements: z.string().max(20000).optional(),
  type: z.enum(PROJECT_TYPE_VALUES).optional(),
  // Free-form (taxonomy lives in the frontend, not enum-constrained at the
  // model level either — see project.model.js's own comment).
  category: z.string().trim().min(1).max(200),
  subCategory: z.string().max(200).optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  location: z.string().trim().min(2).max(200),
  isRemote: z.boolean().optional(),
  budgetMin: nonNegativeNumber.optional(),
  budgetMax: nonNegativeNumber.optional(),
  expectedDeliveryDays: nonNegativeInt.optional(),
  currency: z.enum(["INR", "USD"]).optional(),
  status: z.enum(["open", "closed", "draft"]).optional(),
  visibility: z.enum(PROJECT_VISIBILITY_VALUES).optional(),
  requiresNda: z.boolean().optional(),
  ndaText: z.string().max(20000).optional(),
  attachments: z.array(attachmentSchema).max(20).optional(),
};

const budgetRefine = (d) => d.budgetMin === undefined || d.budgetMax === undefined || d.budgetMax === 0 || d.budgetMax >= d.budgetMin;
const budgetRefineOpts = { message: "budgetMax must be greater than or equal to budgetMin", path: ["budgetMax"] };

export const createProjectSchema = z.object(baseProjectShape).strict().refine(budgetRefine, budgetRefineOpts);
export const updateProjectSchema = z.object(baseProjectShape).partial().strict().refine(budgetRefine, budgetRefineOpts);

export const inviteFreelancerToProjectSchema = z.object({ freelancerId: objectIdString("freelancerId") }).strict();

export const applyToProjectSchema = z
  .object({
    coverLetter: z.string().max(10000).optional(),
    resumeUrl: z.string().trim().max(2048).optional(),
    proposedRate: nonNegativeNumber.optional(),
    deliveryDays: nonNegativeInt.optional(),
  })
  .strict();

export const directHireSchema = z
  .object({
    scopeTitle: z.string().trim().min(1).max(200),
    scopeDescription: z.string().trim().min(1).max(20000),
    amount: z.number().positive(),
    deliveryDays: nonNegativeInt.optional(),
  })
  .strict();

export const listProjectsQuerySchema = z.object({
  search: searchQueryString(),
  type: z.enum(PROJECT_TYPE_VALUES).optional(),
  category: searchQueryString(200),
  subCategory: searchQueryString(200),
  isRemote: z.enum(["true", "false"]).optional(),
});
