import winston from "winston";

// Plain text in dev (readable in a terminal), JSON in production (parseable
// by a log aggregator). Errors always carry their stack trace.
const isProduction = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProduction ? winston.format.json() : winston.format.combine(winston.format.colorize(), winston.format.simple())
  ),
  transports: [new winston.transports.Console({ silent: process.env.NODE_ENV === "test" })],
});

// morgan's `stream` option expects a `.write(message)` — hand it straight to
// winston's http level so request logs go through the same pipeline/format.
export const morganStream = {
  write: (message) => logger.http(message.trim()),
};
