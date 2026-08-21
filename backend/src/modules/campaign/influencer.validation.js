import { z } from "zod";
import { searchQueryString, queryNumber, queryBooleanString } from "../../validation/common.js";

export const listInfluencersQuerySchema = z.object({
  search: searchQueryString(),
  niche: searchQueryString(200),
  // Not enum-constrained — influencerProfile.category is free-form,
  // client-side taxonomy at the model level too (see the controller's own
  // comment), same reasoning as Job/Project's category fields.
  category: searchQueryString(200),
  location: searchQueryString(),
  minRating: queryNumber(0, 5),
  verifiedOnly: queryBooleanString(),
  platform: searchQueryString(60),
  minFollowers: queryNumber(),
  maxFollowers: queryNumber(),
  maxBudget: queryNumber(),
  sort: z.enum(["newest", "rating", "reviews", "followers", "campaigns", "match"]).optional(),
});
