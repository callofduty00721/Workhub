import { z } from "zod";
import mongoose from "mongoose";

// Body-field equivalent of middleware/validateObjectId.js (that one only
// covers route params) — for any body field that references another
// document (e.g. inviteFreelancer's freelancerId).
export const objectIdString = (label = "id") =>
  z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), { message: `Invalid ${label}` });

// Every schema in this rollout uses .strict() (reject unrecognized keys, not
// just strip them) so a request carrying a field outside the documented
// shape gets a clear 400 naming the field, rather than the field being
// silently dropped or — worse — mass-assigned onto a Mongoose doc via a
// stray `{ ...req.body }` spread. This helper just documents that choice in
// one place; schemas still call z.object({...}).strict() themselves so the
// field list stays inline and readable next to the model it validates.
export const nonEmptyString = (max, min = 1) => z.string().trim().min(min).max(max);
export const optionalString = (max) => z.string().trim().max(max).optional();
// `""` is treated as "not provided" for an optional free-text field — mirrors
// how these models default the field to "" rather than leaving it undefined.
export const optionalStringOrEmpty = (max) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((v) => v ?? "");

export const nonNegativeNumber = z.number().min(0);
export const positiveInt = z.number().int().positive();
export const nonNegativeInt = z.number().int().min(0);

export const urlOptional = z.string().trim().url().max(2048).optional().or(z.literal(""));

// --- Query-string helpers ---
// Every value off req.query arrives as a string (or an array of strings, or
// undefined) — these coerce+bound them the same way every list/filter
// endpoint's `?min=`/`?max=`/`?verified=` param is actually used downstream,
// so a non-numeric or wildly out-of-range value is rejected up front instead
// of silently becoming NaN (a "matches nothing" Mongo query, not a crash,
// but not a real validation boundary either).
export const searchQueryString = (max = 200) => z.string().trim().max(max).optional();
export const queryNumber = (min = 0, max = 1_000_000_000) => z.coerce.number().min(min).max(max).optional();
export const queryInt = (min = 0, max = 1_000_000) => z.coerce.number().int().min(min).max(max).optional();
// Query params are always strings — controllers check `=== "true"` (any
// other value already means "false"/unset), so this only needs to reject
// something that isn't even a plausible boolean string, not enforce strict
// booleans.
export const queryBooleanString = () => z.enum(["true", "false"]).optional();
