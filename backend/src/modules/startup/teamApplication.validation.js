import { z } from "zod";

export const createTeamApplicationSchema = z
  .object({
    roleTitle: z.string().trim().min(1).max(200),
    roleType: z.enum(["full_time", "part_time"]).optional(),
    isCustomRole: z.boolean().optional(),
    bio: z.string().trim().min(1).max(5000),
    experience: z.string().trim().min(1).max(5000),
    skills: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
    resumeUrl: z.string().trim().max(2048).optional(),
  })
  .strict();

export const updateTeamApplicationStatusSchema = z.object({ status: z.enum(["pending", "reviewing", "accepted", "rejected"]) }).strict();
