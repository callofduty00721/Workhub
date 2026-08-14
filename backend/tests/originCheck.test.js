import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requireTrustedOrigin } from "../src/middleware/originCheck.js";

describe("requireTrustedOrigin", () => {
  const originalClientUrl = process.env.CLIENT_URL;

  beforeEach(() => {
    process.env.CLIENT_URL = "http://localhost:5173";
  });

  afterEach(() => {
    process.env.CLIENT_URL = originalClientUrl;
  });

  it("allows a request with no Origin/Referer header (non-browser clients)", () => {
    const next = vi.fn();
    requireTrustedOrigin({ headers: {} }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("allows a request whose Origin matches CLIENT_URL", () => {
    const next = vi.fn();
    requireTrustedOrigin({ headers: { origin: "http://localhost:5173" } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("allows a request whose Referer starts with CLIENT_URL", () => {
    const next = vi.fn();
    requireTrustedOrigin({ headers: { referer: "http://localhost:5173/login" } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects a request from an untrusted Origin with a 403 ApiError", () => {
    const next = vi.fn();
    requireTrustedOrigin({ headers: { origin: "https://evil.example.com" } }, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it("skips the check entirely when CLIENT_URL isn't configured", () => {
    delete process.env.CLIENT_URL;
    const next = vi.fn();
    requireTrustedOrigin({ headers: { origin: "https://evil.example.com" } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});
