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

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    details: err.details,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
