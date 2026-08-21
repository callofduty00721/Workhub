import { z } from "zod";

const milestoneItemSchema = z.object({ title: z.string().trim().min(1).max(300), amount: z.number().positive() }).strict();

export const createMilestonesSchema = z.object({ milestones: z.array(milestoneItemSchema).min(1).max(50) }).strict();
