import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import mongoSanitize from "express-mongo-sanitize";

// Isolated from the real app (which needs a DB connection for almost every
// route) — this just confirms the sanitize middleware itself does what
// app.js relies on it for: stripping Mongo operator keys out of the request
// body so a query built from user input can't inject a $where/$gt clause.
function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.use(mongoSanitize());
  app.post("/echo", (req, res) => res.json({ body: req.body }));
  return app;
}

describe("express-mongo-sanitize wiring", () => {
  it("strips Mongo operator keys from the request body", async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post("/echo")
      .send({ email: { $gt: "" }, password: "whatever" });

    expect(res.status).toBe(200);
    expect(res.body.body.email).toEqual({});
    expect(res.body.body.password).toBe("whatever");
  });

  it("leaves an ordinary payload untouched", async () => {
    const app = buildTestApp();
    const res = await request(app).post("/echo").send({ name: "Aditya", age: 30 });

    expect(res.status).toBe(200);
    expect(res.body.body).toEqual({ name: "Aditya", age: 30 });
  });
});
