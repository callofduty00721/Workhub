import { z } from "zod";

// Public, unauthenticated form — the strictest surface in the app to leave
// unvalidated, since anyone can post here with no rate-limit account key.
export const submitContactMessageSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().toLowerCase().email().max(320),
    subject: z.string().max(300).optional(),
    message: z.string().trim().min(1).max(10000),
  })
  .strict();
