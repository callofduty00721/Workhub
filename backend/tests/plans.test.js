import { describe, it, expect } from "vitest";
import Plan, { PLAN_ROLES, PLAN_TIERS } from "../src/modules/finance/plan.model.js";

// The old plans.test.js tested a static PLANS/getPlan config that no longer
// exists — plans became a DB-backed, per-role model (one Plan doc per
// role+tier, seeded by scripts/seed/seedPlans.js, admin-editable). This
// covers the model's own invariants the same way models.test.js does for
// Job/User/Application, since there's no more static config to unit-test.
describe("Plan model validation", () => {
  it("requires role, tier, name, and priceInInr", () => {
    const err = new Plan({}).validateSync();
    expect(err.errors.role).toBeDefined();
    expect(err.errors.tier).toBeDefined();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.priceInInr).toBeDefined();
  });

  it("defaults maxListings to -1 (unlimited)", () => {
    const plan = new Plan({ role: "founder", tier: "free", name: "Free", priceInInr: 0 });
    expect(plan.validateSync()).toBeUndefined();
    expect(plan.maxListings).toBe(-1);
  });

  it("defaults priceInInrYearly to 0 and rejects a negative value", () => {
    const plan = new Plan({ role: "founder", tier: "free", name: "Free", priceInInr: 0 });
    expect(plan.validateSync()).toBeUndefined();
    expect(plan.priceInInrYearly).toBe(0);

    const negative = new Plan({ role: "founder", tier: "pro", name: "Pro", priceInInr: 999, priceInInrYearly: -1 });
    expect(negative.validateSync().errors.priceInInrYearly).toBeDefined();
  });

  it("rejects a role or tier outside the known enums", () => {
    const badRole = new Plan({ role: "not_a_role", tier: "free", name: "x", priceInInr: 0 });
    expect(badRole.validateSync().errors.role).toBeDefined();

    const badTier = new Plan({ role: "founder", tier: "not_a_tier", name: "x", priceInInr: 0 });
    expect(badTier.validateSync().errors.tier).toBeDefined();
  });

  it("rejects a negative price", () => {
    const plan = new Plan({ role: "founder", tier: "free", name: "Free", priceInInr: -1 });
    expect(plan.validateSync().errors.priceInInr).toBeDefined();
  });

  it("covers every role that actually has plans (freelancer plans are about visibility, not listing caps, but still get a row)", () => {
    for (const role of PLAN_ROLES) {
      for (const tier of PLAN_TIERS) {
        const plan = new Plan({ role, tier, name: `${role}-${tier}`, priceInInr: 0 });
        expect(plan.validateSync()).toBeUndefined();
      }
    }
  });

  it("declares a unique index on role+tier — one plan per (role, tier)", () => {
    const indexes = Plan.schema.indexes();
    const roleTierIndex = indexes.find(([keys]) => keys.role === 1 && keys.tier === 1);
    expect(roleTierIndex).toBeDefined();
    expect(roleTierIndex[1].unique).toBe(true);
  });
});
