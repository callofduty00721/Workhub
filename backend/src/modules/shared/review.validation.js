import { z } from "zod";
import { objectIdString } from "../../validation/common.js";

export const listReviewsQuerySchema = z.object({ targetType: z.enum(["user", "service", "startup"]), targetId: objectIdString("targetId") });

export const createReviewSchema = z
  .object({
    targetType: z.enum(["user", "service", "startup"]),
    targetId: objectIdString("targetId"),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(5000).optional(),
  })
  .strict();
