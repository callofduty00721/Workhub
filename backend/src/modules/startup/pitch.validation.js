import { z } from "zod";
import { objectIdString } from "../../validation/common.js";

export const sendPitchSchema = z
  .object({
    startupId: objectIdString("startupId"),
    investorId: objectIdString("investorId"),
    message: z.string().max(5000).optional(),
  })
  .strict();
