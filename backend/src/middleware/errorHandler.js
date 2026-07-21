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
