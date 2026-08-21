import { z } from "zod";
import { PARTNER_TYPE_VALUES, PARTNERSHIP_TYPE_VALUES_EXPORT as PARTNERSHIP_TYPE_VALUES } from "../shared/user.model.js";
import { searchQueryString, queryBooleanString } from "../../validation/common.js";

export const listPartnersQuerySchema = z.object({
  search: searchQueryString(),
  type: z.enum(PARTNER_TYPE_VALUES).optional(),
  service: searchQueryString(200),
  industry: searchQueryString(200),
  location: searchQueryString(),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "500+", ""]).optional(),
  partnershipType: z.enum(PARTNERSHIP_TYPE_VALUES).optional(),
  verified: queryBooleanString(),
  sort: z.enum(["newest", "clients", "projects"]).optional(),
});
