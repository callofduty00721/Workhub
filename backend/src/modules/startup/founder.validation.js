import { z } from "zod";
import { searchQueryString } from "../../validation/common.js";

export const listFoundersQuerySchema = z.object({
  search: searchQueryString(),
});
