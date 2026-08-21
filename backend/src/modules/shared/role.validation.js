import { z } from "zod";
import { CATEGORIES } from "../../utils/roleCategories.js";
import { ROLE_VALUES } from "./user.model.js";

export const selectCategorySchema = z.object({ category: z.enum(CATEGORIES) }).strict();

export const addRolesSchema = z.object({ roles: z.array(z.enum(ROLE_VALUES)).min(1).max(ROLE_VALUES.length) }).strict();

export const switchRoleSchema = z.object({ role: z.enum(ROLE_VALUES) }).strict();

const verificationDocumentSchema = z.object({ url: z.string().trim().min(1).max(2048), name: z.string().trim().min(1).max(255) }).strict();

export const requestVerificationSchema = z.object({ documents: z.array(verificationDocumentSchema).min(1).max(20) }).strict();

export const reviewVerificationSchema = z.object({ approve: z.boolean(), note: z.string().max(2000).optional() }).strict();
