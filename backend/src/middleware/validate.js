import { ApiError } from "./errorHandler.js";

// Wraps a Zod schema as Express middleware — parses `req[source]` (default
// "body"; pass "query" or "params" for the others) and REJECTS the request
// on any mismatch rather than sanitizing/coercing bad input into something
// "close enough". On failure, throws the same ApiError(400, ...) shape every
// other validation failure in this codebase already uses (see
// errorHandler.js's Mongoose ValidationError branch), so a client can't tell
// a schema rejection apart from any other 400. On success, req[source] is
// REPLACED with the parsed value (Zod's .transform()/.default()/coercion
// applied) — downstream code only ever sees data that already passed the
// schema, never the raw input, so there's no way to "validate then ignore
// the result" by accident.
export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => `${issue.path.join(".") || source}: ${issue.message}`);
      throw new ApiError(400, "Validation failed", details);
    }
    req[source] = result.data;
    next();
  };
}
