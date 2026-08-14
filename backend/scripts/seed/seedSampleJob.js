import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import { assertNotProduction } from "../../src/utils/seedGuard.js";
import User from "../../src/modules/shared/user.model.js";
import Job from "../../src/modules/jobs/job.model.js";

const DEMO_PASSWORD = "Demo@12345";

// Reuses the same demo employer seedDemoContent.js creates, so this script
// can run standalone without duplicating that employer if it already exists.
const EMPLOYER = {
  name: "Vikram Joshi",
  email: "vikram.joshi@growhive.demo",
  headline: "HR Manager, TechNova Solutions",
  companyName: "TechNova Solutions",
  location: "Bengaluru, Karnataka, India",
};

const SAMPLE_JOB = {
  title: "Backend Engineer (Node.js)",
  companyName: EMPLOYER.companyName,
  description:
    "TechNova Solutions is hiring a Backend Engineer to design and build the APIs powering our core product. You'll work on our Node.js/Express services, MongoDB data models, and help scale our infrastructure as we grow.",
  responsibilities: "Design REST APIs, write and review backend code, optimize database queries, own service reliability.",
  requirements: "3+ years with Node.js and Express, solid MongoDB/Mongoose experience, comfort with async systems and testing.",
  type: "full_time",
  category: "IT & Software",
  experienceLevel: "mid",
  skills: ["Node.js", "Express", "MongoDB", "REST APIs"],
  location: "Bengaluru, Karnataka, India",
  isRemote: true,
  salaryMin: 60000,
  salaryMax: 95000,
  currency: "INR",
  status: "open",
};

async function upsertUser(data, role) {
  let user = await User.findOne({ email: data.email });
  if (!user) {
    user = new User({ ...data, role, password: DEMO_PASSWORD, isEmailVerified: true, isProfileComplete: true });
    await user.save();
    console.log(`Created ${role}: ${data.name}`);
  } else {
    console.log(`Reusing existing ${role}: ${data.name}`);
  }
  return user;
}

async function run() {
  assertNotProduction("seedSampleJob");
  await connectDB();

  const employer = await upsertUser(EMPLOYER, "employer");

  const existing = await Job.findOne({ title: SAMPLE_JOB.title, employer: employer._id });
  if (existing) {
    console.log(`Skipping (already exists): ${SAMPLE_JOB.title}`);
  } else {
    await Job.create({ ...SAMPLE_JOB, employer: employer._id });
    console.log(`Created job: ${SAMPLE_JOB.title}`);
  }

  await mongoose.connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
