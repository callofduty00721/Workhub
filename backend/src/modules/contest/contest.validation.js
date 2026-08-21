import { z } from "zod";
import { searchQueryString } from "../../validation/common.js";

// Categories are free text (see contest.controller.js's own comment on
// getContestCategories) — not enum-constrained here either, same reasoning.
const baseContestShape = {
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(1).max(20000),
  category: z.string().trim().min(1).max(200),
  skills: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  prizeAmount: z.number().min(0),
  currency: z.enum(["INR", "USD"]).optional(),
  deadline: z.coerce.date(),
  status: z.enum(["open", "judging", "closed"]).optional(),
};

export const createContestSchema = z.object(baseContestShape).strict();
export const updateContestSchema = z.object(baseContestShape).partial().strict();

export const submitEntrySchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    description: z.string().trim().min(1).max(20000),
    fileUrl: z.string().trim().max(2048).optional(),
  })
  .strict();

export const listContestsQuerySchema = z.object({
  search: searchQueryString(),
  category: searchQueryString(200),
});
