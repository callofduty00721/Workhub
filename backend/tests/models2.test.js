import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Job, { JOB_TYPE_VALUES, EXPERIENCE_LEVEL_VALUES } from "../src/models/Job.js";
import Application from "../src/models/Application.js";
import User, { ROLE_VALUES } from "../src/models/User.js";

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

  it("includes job_seeker nowhere in the role enum (merged into freelancer)", () => {
    expect(ROLE_VALUES).not.toContain("job_seeker");
    expect(ROLE_VALUES).toContain("freelancer");
  });

  it("rejects a role outside the known enum", () => {
    const user = new User({ name: "Test User", email: "test@mahahub.demo", role: "not_a_role" });
    expect(user.validateSync().errors.role).toBeDefined();
  });
});
