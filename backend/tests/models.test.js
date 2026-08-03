import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Contest from "../src/modules/contest/contest.model.js";
import ContestEntry from "../src/modules/contest/contestEntry.model.js";
import Payment from "../src/modules/shared/payment.model.js";
import Withdrawal from "../src/modules/finance/withdrawal.model.js";
import Alert from "../src/modules/productivity/alert.model.js";
import Milestone from "../src/modules/jobs/milestone.model.js";
import Job, { JOB_TYPE_VALUES, EXPERIENCE_LEVEL_VALUES } from "../src/modules/jobs/job.model.js";
import Application from "../src/modules/shared/application.model.js";
import User, { ROLE_VALUES } from "../src/modules/shared/user.model.js";

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

  it("defaults status to pending, disputeStatus to none, and escrowStatus to held", () => {
    const payment = new Payment({
      payer: new mongoose.Types.ObjectId(),
      payee: new mongoose.Types.ObjectId(),
      type: "gig_order",
      amount: 2500,
    });
    expect(payment.validateSync()).toBeUndefined();
    expect(payment.status).toBe("pending");
    expect(payment.disputeStatus).toBe("none");
    expect(payment.escrowStatus).toBe("held");
  });

  it("rejects an escrowStatus outside held/released", () => {
    const payment = new Payment({
      payer: new mongoose.Types.ObjectId(),
      payee: new mongoose.Types.ObjectId(),
      type: "gig_order",
      amount: 2500,
      escrowStatus: "somewhere_else",
    });
    expect(payment.validateSync().errors.escrowStatus).toBeDefined();
  });
});

describe("Withdrawal model validation", () => {
  it("requires freelancer, amount, and method", () => {
    const err = new Withdrawal({}).validateSync();
    expect(err.errors.freelancer).toBeDefined();
    expect(err.errors.amount).toBeDefined();
    expect(err.errors.method).toBeDefined();
  });

  it("rejects a method outside upi/bank", () => {
    const withdrawal = new Withdrawal({
      freelancer: new mongoose.Types.ObjectId(),
      amount: 500,
      method: "crypto",
      upiId: "someone@upi",
    });
    expect(withdrawal.validateSync().errors.method).toBeDefined();
  });

  it("rejects a non-positive amount", () => {
    const withdrawal = new Withdrawal({
      freelancer: new mongoose.Types.ObjectId(),
      amount: 0,
      method: "upi",
      upiId: "someone@upi",
    });
    expect(withdrawal.validateSync().errors.amount).toBeDefined();
  });

  it("defaults status to pending and provider to manual", () => {
    const withdrawal = new Withdrawal({
      freelancer: new mongoose.Types.ObjectId(),
      amount: 500,
      method: "upi",
      upiId: "someone@upi",
    });
    expect(withdrawal.validateSync()).toBeUndefined();
    expect(withdrawal.status).toBe("pending");
    expect(withdrawal.provider).toBe("manual");
  });
});

describe("Alert model validation", () => {
  it("requires user and at least the keywords array field to be present", () => {
    const err = new Alert({}).validateSync();
    expect(err.errors.user).toBeDefined();
  });

  it("defaults isActive to true and remoteOnly to false", () => {
    const alert = new Alert({ user: new mongoose.Types.ObjectId(), keywords: ["React"] });
    expect(alert.validateSync()).toBeUndefined();
    expect(alert.isActive).toBe(true);
    expect(alert.remoteOnly).toBe(false);
  });
});

describe("Milestone model validation", () => {
  it("requires application, title, and amount", () => {
    const err = new Milestone({}).validateSync();
    expect(err.errors.application).toBeDefined();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.amount).toBeDefined();
  });

  it("rejects a non-positive amount", () => {
    const milestone = new Milestone({ application: new mongoose.Types.ObjectId(), title: "Design phase", amount: 0 });
    expect(milestone.validateSync().errors.amount).toBeDefined();
  });

  it("defaults status to pending", () => {
    const milestone = new Milestone({ application: new mongoose.Types.ObjectId(), title: "Design phase", amount: 5000 });
    expect(milestone.validateSync()).toBeUndefined();
    expect(milestone.status).toBe("pending");
  });
});

describe("Job model validation", () => {
  it("requires title, companyName, description, and location", () => {
    const err = new Job({}).validateSync();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.companyName).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.location).toBeDefined();
  });

  it("defaults type to full_time and status to open", () => {
    const job = new Job({
      employer: new mongoose.Types.ObjectId(),
      title: "Frontend Engineer",
      companyName: "MahaHub",
      description: "Build things",
      location: "Remote",
    });
    expect(job.validateSync()).toBeUndefined();
    expect(job.type).toBe("full_time");
    expect(job.status).toBe("open");
  });

  it("exposes every job type and experience level as valid enum values", () => {
    for (const type of JOB_TYPE_VALUES) {
      const job = new Job({
        employer: new mongoose.Types.ObjectId(),
        title: "t",
        companyName: "c",
        description: "d",
        location: "l",
        type,
      });
      expect(job.validateSync()).toBeUndefined();
    }
    for (const level of EXPERIENCE_LEVEL_VALUES) {
      const job = new Job({
        employer: new mongoose.Types.ObjectId(),
        title: "t",
        companyName: "c",
        description: "d",
        location: "l",
        experienceLevel: level,
      });
      expect(job.validateSync()).toBeUndefined();
    }
  });

  it("rejects a job type outside the known enum", () => {
    const job = new Job({
      employer: new mongoose.Types.ObjectId(),
      title: "t",
      companyName: "c",
      description: "d",
      location: "l",
      type: "gig_economy_thing",
    });
    expect(job.validateSync().errors.type).toBeDefined();
  });
});

describe("Application model validation", () => {
  it("requires job and applicant", () => {
    const err = new Application({}).validateSync();
    expect(err.errors.job).toBeDefined();
    expect(err.errors.applicant).toBeDefined();
  });

  it("defaults status to applied and proposedRate/deliveryDays to 0", () => {
    const application = new Application({
      job: new mongoose.Types.ObjectId(),
      applicant: new mongoose.Types.ObjectId(),
    });
    expect(application.validateSync()).toBeUndefined();
    expect(application.status).toBe("applied");
    expect(application.proposedRate).toBe(0);
    expect(application.deliveryDays).toBe(0);
  });

  it("accepts withdrawn as a valid status (freelancer proposal withdrawal)", () => {
    const application = new Application({
      job: new mongoose.Types.ObjectId(),
      applicant: new mongoose.Types.ObjectId(),
      status: "withdrawn",
    });
    expect(application.validateSync()).toBeUndefined();
  });
});

describe("User model validation", () => {
  it("requires name and email", () => {
    const err = new User({}).validateSync();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.email).toBeDefined();
  });

  it("defaults role to freelancer", () => {
    const user = new User({ name: "Test User", email: "test@mahahub.demo" });
    expect(user.validateSync()).toBeUndefined();
    expect(user.role).toBe("freelancer");
  });

  it("includes job_seeker and influencer as distinct talent-category roles", () => {
    expect(ROLE_VALUES).toContain("job_seeker");
    expect(ROLE_VALUES).toContain("influencer");
    expect(ROLE_VALUES).toContain("freelancer");
  });

  it("rejects a role outside the known enum", () => {
    const user = new User({ name: "Test User", email: "test@mahahub.demo", role: "not_a_role" });
    expect(user.validateSync().errors.role).toBeDefined();
  });
});
