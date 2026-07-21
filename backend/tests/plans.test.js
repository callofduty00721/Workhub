import { describe, it, expect } from "vitest";
import { getPlan, PLANS } from "../src/config/plans.js";

describe("getPlan", () => {
  it("returns the matching plan for a known planId", () => {
    expect(getPlan("professional")).toEqual(PLANS.professional);
  });

  it("returns undefined for an unknown planId", () => {
    expect(getPlan("nonexistent")).toBeUndefined();
  });

  it("prices every paid plan above the free plan", () => {
    expect(PLANS.free.priceInInr).toBe(0);
    expect(PLANS.starter.priceInInr).toBeGreaterThan(PLANS.free.priceInInr);
    expect(PLANS.professional.priceInInr).toBeGreaterThan(PLANS.starter.priceInInr);
    expect(PLANS.enterprise.priceInInr).toBeGreaterThan(PLANS.professional.priceInInr);
  });
});
