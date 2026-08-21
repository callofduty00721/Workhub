import { z } from "zod";
import { MENTOR_CATEGORY_VALUES_EXPORT as MENTOR_CATEGORY_VALUES } from "../shared/user.model.js";
import { searchQueryString, queryNumber, queryBooleanString } from "../../validation/common.js";

export const listMentorsQuerySchema = z.object({
  search: searchQueryString(),
  expertise: searchQueryString(100),
  category: z.enum(MENTOR_CATEGORY_VALUES).optional(),
  location: searchQueryString(),
  verified: queryBooleanString(),
  language: searchQueryString(100),
  sessionFormat: z.enum(["video", "chat", "in_person"]).optional(),
  minPrice: queryNumber(),
  maxPrice: queryNumber(),
  sort: z.enum(["rating", "newest", "experience"]).optional(),
});

export const requestSessionSchema = z
  .object({
    topic: z.string().trim().min(1).max(300),
    message: z.string().max(5000).optional(),
    preferredTime: z.coerce.date().optional(),
  })
  .strict();

export const updateSessionStatusSchema = z.object({ status: z.enum(["requested", "confirmed", "completed", "cancelled"]) }).strict();
