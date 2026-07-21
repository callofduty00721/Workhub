import { describe, it, expect, vi } from "vitest";
import { ApiError, errorHandler, notFound } from "../src/middleware/errorHandler.js";

function mockRes() {
  const res = { statusCode: 200 }; // Express defaults res.statusCode to 200 before a handler sets it.
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("ApiError", () => {
  it("carries statusCode, message, and details", () => {
    const err = new ApiError(404, "Not found", { field: "id" });
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err.details).toEqual({ field: "id" });
    expect(err).toBeInstanceOf(Error);
  });
});

describe("notFound middleware", () => {
  it("forwards a 404 ApiError with the requested URL", () => {
    const req = { originalUrl: "/api/does-not-exist" };
    const next = vi.fn();
    notFound(req, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain("/api/does-not-exist");
  });
});

describe("errorHandler middleware", () => {
  it("responds with the ApiError's statusCode and message", () => {
    const res = mockRes();
    errorHandler(new ApiError(403, "Forbidden"), {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Forbidden" }));
  });

  it("maps a Mongo duplicate-key error (code 11000) to a 409 with the offending field name", () => {
    const res = mockRes();
    const dupError = Object.assign(new Error("duplicate"), { code: 11000, keyValue: { email: "a@b.com" } });
    errorHandler(dupError, {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "email already in use" }));
  });

  it("maps a Mongoose ValidationError to a 400 with per-field messages", () => {
    const res = mockRes();
    const validationError = Object.assign(new Error("validation failed"), {
      name: "ValidationError",
      errors: { title: { message: "Title is required" } },
    });
    errorHandler(validationError, {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Validation failed", details: ["Title is required"] }));
  });

  it("defaults to a 500 for an unrecognized error", () => {
    const res = mockRes();
    errorHandler(new Error("boom"), {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
