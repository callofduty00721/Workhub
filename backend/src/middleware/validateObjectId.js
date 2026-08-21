import mongoose from "mongoose";
import { ApiError } from "./errorHandler.js";

// Registered per-router via `router.param(name, validateObjectId)` — runs
// before any route handler that has `:name` in its path, for every route in
// that router. A malformed id would otherwise reach Mongoose's findById/
// findOne and throw a CastError, which errorHandler.js doesn't special-case
// (falls through to the generic 500 branch) instead of a clean 400.
export function validateObjectId(req, res, next, value) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return next(new ApiError(400, "Invalid ID"));
  }
  next();
}
