import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

// These hit the real Express app but only routes that resolve before touching
// MongoDB (health check, unknown routes, and auth-rejected protected routes),
// so they run without a database connection.
describe("GET /api/health", () => {
  it("returns 200 with an ok status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, status: "ok" });
  });
});

describe("unknown routes", () => {
  it("returns 404 for a route that doesn't exist", async () => {
    const res = await request(app).get("/api/this-route-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("protected routes without a token", () => {
  it("rejects GET /api/admin/stats with 401", async () => {
    const res = await request(app).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });

  it("rejects POST /api/payments/gig-order/:id with 401", async () => {
    const res = await request(app).post("/api/payments/gig-order/000000000000000000000000");
    expect(res.status).toBe(401);
  });
});
