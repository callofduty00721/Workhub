import { z } from "zod";

export const createCompanySchema = z.object({ name: z.string().trim().min(1).max(200) }).strict();

export const inviteMemberSchema = z.object({ email: z.string().trim().toLowerCase().email().max(320) }).strict();
