import { z } from "zod";
import { PACKAGE_NAME_VALUES } from "./service.model.js";
import { searchQueryString, queryNumber, queryInt, queryBooleanString } from "../../validation/common.js";

const extraSchema = z.object({ label: z.string().trim().min(1).max(200), price: z.number().min(0) }).strict();

const packageSchema = z
  .object({
    name: z.enum(PACKAGE_NAME_VALUES),
    title: z.string().max(200).optional(),
    description: z.string().max(5000).optional(),
    price: z.number().min(1),
    deliveryDays: z.number().int().min(1),
    revisions: z.number().int().min(-1).optional(),
    features: z.array(z.string().trim().max(300)).max(30).optional(),
  })
  .strict();

// Matches CreateGig.tsx's own form schema + its plain non-form extra fields
// (skills/images/video/packages/languages/extras/tags) — .strict() closes
// the same mass-assignment gap createService/updateService had.
const baseServiceShape = {
  title: z.string().trim().min(5).max(200),
  category: z.string().trim().min(1).max(200),
  subCategory: z.string().max(200).optional(),
  description: z.string().trim().min(20).max(20000),
  priceType: z.enum(["fixed", "hourly"]).optional(),
  price: z.number().min(1),
  deliveryDays: z.number().int().min(1).optional(),
  revisions: z.number().int().min(-1).optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  experienceLevel: z.enum(["beginner", "intermediate", "expert"]).optional(),
  liveDemoUrl: z.string().trim().max(2048).optional(),
  status: z.enum(["active", "private", "paused", "draft"]).optional(),
  responseTime: z.enum(["Within 1 Hour", "Within a few hours", "Within a day", "Within 2 days"]).optional(),
  cancellationPolicy: z.enum(["Flexible", "Standard", "Strict"]).optional(),
  images: z.array(z.string().trim().max(2048)).max(30).optional(),
  video: z.string().trim().max(2048).optional(),
  packages: z.array(packageSchema).max(3).optional(),
  languages: z.array(z.string().trim().max(100)).max(30).optional(),
  extras: z.array(extraSchema).max(20).optional(),
  tags: z.array(z.string().trim().max(60)).max(15).optional(),
};

export const createServiceSchema = z.object(baseServiceShape).strict();
export const updateServiceSchema = z.object(baseServiceShape).partial().strict();

export const listServicesQuerySchema = z.object({
  search: searchQueryString(),
  category: searchQueryString(),
  subCategory: searchQueryString(),
  priceMin: queryNumber(),
  priceMax: queryNumber(),
  maxDeliveryDays: queryInt(),
  level: z.enum(["new", "level_1", "top_rated"]).optional(),
  minRating: queryNumber(0, 5),
  language: searchQueryString(100),
  sort: z.enum(["price_low", "price_high", "rating", "newest", "best_match"]).optional(),
});

export const listFreelancersQuerySchema = z.object({
  search: searchQueryString(),
  skill: searchQueryString(60),
  category: searchQueryString(),
  subCategory: searchQueryString(),
  location: searchQueryString(),
  level: z.enum(["new", "level_1", "top_rated"]).optional(),
  rateMin: queryNumber(),
  rateMax: queryNumber(),
  minRating: queryNumber(0, 5),
  minExperience: queryInt(0, 80),
  verifiedOnly: queryBooleanString(),
  availability: z.enum(["available", "busy"]).optional(),
  sort: z.enum(["rating", "rate_low", "rate_high", "experience", "newest", "best_match"]).optional(),
});
