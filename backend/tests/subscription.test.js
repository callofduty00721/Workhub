import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Subscription from "../src/modules/finance/subscription.model.js";

describe("Subscription model validation", () => {
  it("defaults billingCycle to monthly", () => {
    const sub = new Subscription({
      user: new mongoose.Types.ObjectId(),
      role: "founder",
      provider: "razorpay",
      amount: 999,
    });
    expect(sub.validateSync()).toBeUndefined();
    expect(sub.billingCycle).toBe("monthly");
  });

  it("accepts yearly as a valid billingCycle", () => {
    const sub = new Subscription({
      user: new mongoose.Types.ObjectId(),
      role: "founder",
      provider: "razorpay",
      amount: 9990,
      billingCycle: "yearly",
    });
    expect(sub.validateSync()).toBeUndefined();
  });

  it("rejects a billingCycle outside monthly/yearly", () => {
    const sub = new Subscription({
      user: new mongoose.Types.ObjectId(),
      role: "founder",
      provider: "razorpay",
      amount: 999,
      billingCycle: "weekly",
    });
    expect(sub.validateSync().errors.billingCycle).toBeDefined();
  });
});
