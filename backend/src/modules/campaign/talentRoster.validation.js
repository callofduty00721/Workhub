import { z } from "zod";
import { objectIdString } from "../../validation/common.js";

export const inviteToRosterSchema = z
  .object({ influencerId: objectIdString("influencerId"), message: z.string().max(2000).optional() })
  .strict();

export const respondToInviteSchema = z.object({ status: z.enum(["accepted", "declined"]) }).strict();
