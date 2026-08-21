import { z } from "zod";

const DISCUSSION_CATEGORIES = ["Questions", "Feedback", "Partnerships", "Investors", "General"];

export const createDiscussionSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    body: z.string().trim().min(1).max(20000),
    category: z.enum(DISCUSSION_CATEGORIES).optional(),
  })
  .strict();

export const reportDiscussionSchema = z.object({ reason: z.string().max(2000).optional() }).strict();

export const createCommentSchema = z.object({ body: z.string().trim().min(1).max(5000) }).strict();

// "All Discussions" is a real sentinel the frontend sends meaning "no
// filter" (see listDiscussions' own check) — not a real category, but a
// valid query value, so it's included here even though createDiscussionSchema
// above deliberately doesn't allow it as something to actually create with.
export const listDiscussionsQuerySchema = z.object({
  category: z.enum([...DISCUSSION_CATEGORIES, "All Discussions"]).optional(),
});
