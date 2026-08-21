import { z } from "zod";
import { searchQueryString } from "../../validation/common.js";

export const listPublicProfilesQuerySchema = z.object({
  search: searchQueryString(),
  category: searchQueryString(200),
});
