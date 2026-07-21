import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Contest from "../src/models/Contest.js";
import ContestEntry from "../src/models/ContestEntry.js";
import Payment from "../src/models/Payment.js";

// validateSync() runs Mongoose's schema validation in-process without needing
// a live database connection, so these tests exercise real schema rules.
describe("Contest model validation", () => {
  it("requires title, description, category, prizeAmount, and deadline", () => {
    const err = new Contest({}).validateSync();
    expect(err).toBeDefined();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.category).toBeDefined();
    expect(err.errors.prizeAmount).toBeDefined();
    expect(err.errors.deadline).toBeDefined();
  });

  it("passes validation with all required fields and defaults status to open", () => {
    const contest = new Contest({
      client: new mongoose.Types.ObjectId(),
      title: "Design a logo",
      description: "We need a logo for our startup",
      category: "Graphics & Design",
      prizeAmount: 5000,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    expect(contest.validateSync()).toBeUndefined();
    expect(contest.status).toBe("open");
    expect(contest.entriesCount).toBe(0);
  });

  it("rejects a negative prize amount", () => {
    const contest = new Contest({
      client: new mongoose.Types.ObjectId(),
      title: "Design a logo",
      description: "We need a logo",
      category: "Graphics & Design",
      prizeAmount: -100,
      deadline: new Date(),
    });
    const err = contest.validateSync();
    expect(err.errors.prizeAmount).toBeDefined();
  });
});

describe("ContestEntry model validation", () => {
  it("requires contest, freelancer, title, and description", () => {
    const err = new ContestEntry({}).validateSync();
    expect(err.errors.contest).toBeDefined();
    expect(err.errors.freelancer).toBeDefined();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.description).toBeDefined();
  });

  it("defaults isWinner to false", () => {
    const entry = new ContestEntry({
      contest: new mongoose.Types.ObjectId(),
      freelancer: new mongoose.Types.ObjectId(),
      title: "My entry",
      description: "My submission",
    });
    expect(entry.validateSync()).toBeUndefined();
    expect(entry.isWinner).toBe(false);
  });
});

describe("Payment model validation", () => {
  it("requires payer, payee, type, and amount", () => {
    const err = new Payment({}).validateSync();
    expect(err.errors.payer).toBeDefined();
    expect(err.errors.payee).toBeDefined();
    expect(err.errors.type).toBeDefined();
    expect(err.errors.amount).toBeDefined();
  });

  it("rejects a type outside gig_order/job_hire/contest_prize", () => {
    const payment = new Payment({
      payer: new mongoose.Types.ObjectId(),
      payee: new mongoose.Types.ObjectId(),
      type: "not_a_real_type",
      amount: 100,
    });
    const err = payment.validateSync();
    expect(err.errors.type).toBeDefined();
  });

  it("defaults status to pending and disputeStatus to none", () => {
    const payment = new Payment({
      payer: new mongoose.Types.ObjectId(),
      payee: new mongoose.Types.ObjectId(),
      type: "gig_order",
      amount: 2500,
    });
    expect(payment.validateSync()).toBeUndefined();
    expect(payment.status).toBe("pending");
    expect(payment.disputeStatus).toBe("none");
  });
});
