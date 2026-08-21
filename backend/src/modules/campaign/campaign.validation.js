import { z } from "zod";
import { CAMPAIGN_PLATFORM_VALUES, COLLABORATION_TYPE_VALUES, PAYMENT_MODE_VALUES } from "./campaign.model.js";
import { objectIdString, searchQueryString } from "../../validation/common.js";

// Matches PostCampaign.tsx's own form schema field-for-field, same reasoning
// as job/project.validation.js — .strict() closes the mass-assignment gap
// createCampaign/updateCampaign had (they stripped only onBehalfOf/isFeatured
// from the spread, leaving employer/company/applicationsCount/viewsCount
// still assignable through `{ ...rest }` / `Object.assign`).
const baseCampaignShape = {
  title: z.string().trim().min(2).max(200),
  companyName: z.string().trim().min(2).max(200),
  description: z.string().trim().min(20).max(20000),
  deliverables: z.string().max(5000).optional(),
  platforms: z.array(z.enum(CAMPAIGN_PLATFORM_VALUES)).min(1).max(CAMPAIGN_PLATFORM_VALUES.length),
  niche: z.string().max(200).optional(),
  location: z.string().trim().min(1).max(200),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  collaboratorsMin: z.number().min(0).optional(),
  collaboratorsMax: z.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  applicationDeadline: z.coerce.date().optional(),
  targetAgeMin: z.number().min(0).max(120).optional(),
  targetAgeMax: z.number().min(0).max(120).optional(),
  influencerCategory: z.string().max(200).optional(),
  minFollowers: z.number().min(0).optional(),
  minEngagementRate: z.number().min(0).max(100).optional(),
  estimatedReachMin: z.number().min(0).optional(),
  estimatedReachMax: z.number().min(0).optional(),
  collaborationType: z.enum(COLLABORATION_TYPE_VALUES).optional(),
  paymentMode: z.enum(PAYMENT_MODE_VALUES).optional(),
  highlights: z.array(z.string().trim().max(500)).max(30).optional(),
  termsAndConditions: z.string().max(20000).optional(),
  status: z.enum(["open", "closed", "draft"]).optional(),
  onBehalfOf: objectIdString("onBehalfOf").optional(),
  imageUrl: z.string().trim().max(2048).optional(),
};

export const createCampaignSchema = z.object(baseCampaignShape).strict();
export const updateCampaignSchema = z.object(baseCampaignShape).partial().strict();

export const applyToCampaignSchema = z
  .object({
    coverLetter: z.string().max(10000).optional(),
    proposedRate: z.number().min(0).optional(),
    deliveryDays: z.number().int().min(0).optional(),
  })
  .strict();

export const inviteToCampaignSchema = z
  .object({ influencerId: objectIdString("influencerId"), message: z.string().max(2000).optional() })
  .strict();

export const listCampaignsQuerySchema = z.object({
  search: searchQueryString(),
  platform: z.enum(CAMPAIGN_PLATFORM_VALUES).optional(),
  employer: objectIdString("employer").optional(),
});
