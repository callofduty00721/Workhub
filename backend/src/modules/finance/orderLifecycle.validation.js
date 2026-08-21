import { z } from "zod";

const deliverableSchema = z.object({ url: z.string().trim().min(1).max(2048), name: z.string().max(255).optional() }).strict();

export const deliverWorkSchema = z
  .object({
    deliverables: z.array(deliverableSchema).min(1, "Add at least one deliverable link").max(20),
    note: z.string().max(5000).optional(),
  })
  .strict();

export const requestRevisionSchema = z.object({ reason: z.string().max(2000).optional() }).strict();

export const requestExtensionSchema = z
  .object({
    proposedDeadline: z.coerce.date(),
    reason: z.string().max(2000).optional(),
  })
  .strict();

export const respondExtensionSchema = z.object({ action: z.enum(["approve", "reject"]) }).strict();
