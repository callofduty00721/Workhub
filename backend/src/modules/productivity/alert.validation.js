import { z } from "zod";

export const createAlertSchema = z
  .object({
    keywords: z.array(z.string().trim().min(1).max(100)).min(1).max(30),
    remoteOnly: z.boolean().optional(),
  })
  .strict();
