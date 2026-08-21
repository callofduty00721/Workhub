import { z } from "zod";
import { ROLE_VALUES, PERMISSION_VALUES } from "../shared/user.model.js";
import { SECURITY_EVENT_TYPE_VALUES } from "../shared/securityEvent.model.js";

// --- users.js ---
export const updateUserRoleSchema = z.object({ role: z.enum(ROLE_VALUES) }).strict();

// --- startups.js ---
export const resolveFlaggedStartupSchema = z.object({ action: z.enum(["dismiss", "suspend"]) }).strict();
export const reviewVerificationRequestSchema = z
  .object({ action: z.enum(["approve", "reject"]), reviewNote: z.string().max(2000).optional() })
  .strict();

// --- payments.js ---
export const resolveDisputeSchema = z
  .object({
    action: z.enum(["refund", "reject"]),
    note: z.string().max(2000).optional(),
    refundAmount: z.number().positive().optional(),
  })
  .strict();

// --- withdrawals.js ---
export const resolveWithdrawalSchema = z
  .object({ action: z.enum(["complete", "reject"]), note: z.string().max(2000).optional() })
  .strict();

// --- kyc.js ---
export const reviewKycSchema = z.object({ action: z.enum(["approve", "reject"]), note: z.string().max(2000).optional() }).strict();
export const reviewProfileVerificationSchema = reviewKycSchema;

// --- grievances.js ---
export const updateGrievanceStatusSchema = z
  .object({ action: z.enum(["acknowledge", "resolve"]), note: z.string().max(5000).optional() })
  .strict()
  .refine((d) => d.action !== "resolve" || !!d.note?.trim(), { message: "A resolution note is required", path: ["note"] });

// --- settings.js ---
export const updatePlatformSettingsSchema = z
  .object({
    commissionPercent: z.number().min(0).max(100),
    phoneAuthProvider: z.enum(["disabled", "firebase"]).optional(),
    allowedEmailDomains: z.array(z.string().trim().min(1).max(200)).max(200).optional(),
    jobsEnabled: z.boolean().optional(),
    disabledRoles: z.array(z.enum(ROLE_VALUES)).max(ROLE_VALUES.length).optional(),
  })
  .strict();

// --- plans.js ---
export const updatePlanSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    priceInInr: z.number().min(0),
    priceInInrYearly: z.number().min(0),
    features: z.array(z.string().trim().max(300)).max(50),
    maxListings: z.number().int().min(-1),
  })
  .partial()
  .strict();

// --- staff.js ---
export const createStaffSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().toLowerCase().email().max(320),
    password: z.string().min(8).max(200),
    permissions: z.array(z.enum(PERMISSION_VALUES)).max(PERMISSION_VALUES.length).optional(),
  })
  .strict();

export const updateStaffPermissionsSchema = z.object({ permissions: z.array(z.enum(PERMISSION_VALUES)).max(PERMISSION_VALUES.length) }).strict();

// --- securityEvents.js ---
// Not .strict() — like every other list endpoint's query schema in this
// codebase, page/limit are validated separately by the shared
// parsePagination() helper, not duplicated here.
export const listSecurityEventsQuerySchema = z.object({
  type: z.enum(SECURITY_EVENT_TYPE_VALUES).optional(),
  email: z.string().trim().max(320).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// --- announcements.js ---
export const sendAnnouncementSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(5000),
    // Omitted/undefined = every user. super_admin/staff are excluded from
    // the recipient set at the controller level regardless of what's picked
    // here (a broadcast is a user-facing message, not an internal memo).
    targetRole: z.enum(ROLE_VALUES).optional(),
  })
  .strict();
