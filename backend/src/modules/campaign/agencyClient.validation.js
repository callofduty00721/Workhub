import { z } from "zod";
import { objectIdString } from "../../validation/common.js";

export const inviteAgencySchema = z
  .object({
    agencyId: objectIdString("agencyId"),
    budget: z.number().min(0).optional(),
    message: z.string().max(2000).optional(),
  })
  .strict();

export const respondToAgencyInviteSchema = z.object({ status: z.enum(["accepted", "declined"]) }).strict();
