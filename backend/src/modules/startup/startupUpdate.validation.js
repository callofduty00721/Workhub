import { z } from "zod";

export const createUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    description: z.string().max(20000).optional(),
    category: z.string().trim().max(100).optional(),
    image: z.string().trim().max(2048).optional(),
  })
  .strict();
