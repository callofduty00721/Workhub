import { z } from "zod";
import { searchQueryString } from "../../validation/common.js";

export const listJobSeekersQuerySchema = z.object({
  search: searchQueryString(),
  location: searchQueryString(),
});
