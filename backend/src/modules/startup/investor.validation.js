import { z } from "zod";
import { INVESTOR_TYPE_VALUES_EXPORT as INVESTOR_TYPE_VALUES, STARTUP_STAGE_VALUES_EXPORT as STARTUP_STAGE_VALUES } from "../shared/user.model.js";
import { searchQueryString, queryNumber, queryBooleanString } from "../../validation/common.js";

export const listInvestorsQuerySchema = z.object({
  search: searchQueryString(),
  focus: searchQueryString(100),
  type: z.enum(INVESTOR_TYPE_VALUES).optional(),
  stage: z.enum(STARTUP_STAGE_VALUES).optional(),
  location: searchQueryString(),
  verified: queryBooleanString(),
  minTicket: queryNumber(),
  maxTicket: queryNumber(),
  sort: z.enum(["newest", "portfolio"]).optional(),
});
