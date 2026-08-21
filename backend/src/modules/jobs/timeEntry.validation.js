import { z } from "zod";

export const addTimeEntrySchema = z
  .object({
    date: z.coerce.date(),
    hours: z.number().min(0.25).max(24),
    description: z.string().max(2000).optional(),
  })
  .strict();
