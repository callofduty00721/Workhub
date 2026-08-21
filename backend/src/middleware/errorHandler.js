import { logger } from "../utils/logger.js";
import { captureException } from "../config/sentry.js";

export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Only unexpected (5xx) failures are worth an error-level log + Sentry
  // report — 4xx codes are expected outcomes (bad input, missing resource).
  if (statusCode >= 500) {
    logger.error(err.message, { stack: err.stack, method: req?.method, url: req?.originalUrl });
    captureException(err);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ success: false, message: `${field} already in use` });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  // A malformed ObjectId (e.g. in a route param not covered by
  // validateObjectId, or a ref field inside a query) throws Mongoose's raw
  // CastError, whose default message embeds the field/model name — not
  // sensitive, but not something we've deliberately written for users either.
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }

  // multer's own built-in errors (file too large, too many files, ...) —
  // finite, well-known, safe messages, distinct from the fileFilter errors
  // in upload.js (those are already ApiError and handled by the trusted
  // branch below).
  if (err.name === "MulterError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Everything else reaching here is either a deliberate ApiError — its
  // message was written by application code specifically to be shown to a
  // user — or a genuinely unexpected failure (a bug, a raw driver/DB error,
  // a timeout, ...). Only the former is safe to echo back. The full message
  // and stack always go to the log/Sentry above regardless; only a generic
  // message reaches the response for anything we didn't author ourselves, so
  // a raw database error or an internal file path never reaches the client.
  const isTrustedError = err instanceof ApiError;

  res.status(statusCode).json({
    success: false,
    message: isTrustedError ? err.message : "Something went wrong. Please try again.",
    details: isTrustedError ? err.details : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
