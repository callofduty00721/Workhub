import { describe, it, expect, vi } from "vitest";
import { requirePermission } from "../src/middleware/auth.js";

function mockNext() {
  return vi.fn();
}

// requirePermission throws synchronously on rejection (same as authorize()) —
// Express's own router catches that from a non-async middleware and forwards
// it to the error handler, but calling the middleware directly here means
// the test has to do that catching itself.
function callAndCaptureError(middleware, req) {
  try {
    middleware(req, {}, mockNext());
    return null;
  } catch (err) {
    return err;
  }
}

describe("requirePermission", () => {
  it("always allows a super_admin, regardless of staffPermissions", () => {
    const next = mockNext();
    requirePermission("kyc")({ user: { role: "super_admin", staffPermissions: [] } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("allows a staff account whose staffPermissions includes the required permission", () => {
    const next = mockNext();
    requirePermission("kyc")({ user: { role: "staff", staffPermissions: ["kyc", "grievances"] } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects a staff account missing the required permission", () => {
    const err = callAndCaptureError(requirePermission("kyc"), { user: { role: "staff", staffPermissions: ["grievances"] } });
    expect(err?.statusCode).toBe(403);
  });

  it("rejects a staff account with no staffPermissions at all", () => {
    const err = callAndCaptureError(requirePermission("kyc"), { user: { role: "staff" } });
    expect(err?.statusCode).toBe(403);
  });

  it("rejects any other role outright — a permission check never widens what authorize() already narrowed", () => {
    const err = callAndCaptureError(requirePermission("kyc"), { user: { role: "freelancer", staffPermissions: ["kyc"] } });
    expect(err?.statusCode).toBe(403);
  });
});
