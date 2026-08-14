import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import { assertNotProduction } from "../../src/utils/seedGuard.js";
import User from "../../src/modules/shared/user.model.js";
import Job from "../../src/modules/jobs/job.model.js";

const DEMO_PASSWORD = "Demo@12345";

// Real listing content transcribed from a Naukri.com job posting the user
// shared (TCS "SAP Fiori Developer" virtual-interview drive) — used to
// exercise the new Role/Industry Type/Department/Role Category/Education
// overview fields on the job detail page with real-shaped data.
const EMPLOYER = {
  name: "TCS Talent Acquisition",
  email: "careers@tcs.growhive.demo",
  headline: "Talent Acquisition, Tata Consultancy Services",
  companyName: "Tata Consultancy Services",
  location: "Mumbai, Maharashtra, India",
};

const SAMPLE_JOB = {
  title: "TCS Virtual Interview on 7th Aug 26 For SAP Fiori Developer",
  companyName: EMPLOYER.companyName,
  description:
    "We are looking for experienced SAP FIORI Consultants with 8 to 12 years of experience for opportunities across Pan India.",
  responsibilities:
    "Design, develop, and deploy SAP Fiori/UI5 applications. Develop and consume OData services using SAP Gateway. Configure and maintain Fiori Launchpad roles, catalogs, and groups. Collaborate with functional teams to deliver business solutions. Perform application enhancements, troubleshooting, and performance optimization. Support SAP S/4HANA implementations and upgrades. Ensure adherence to SAP development standards and best practices.",
  requirements:
    "SAP Fiori & SAPUI5 Development, SAP Gateway & OData Services, SAP Fiori Launchpad Configuration, SAP S/4HANA Integration, HTML5, CSS3, JavaScript, jQuery, ABAP Backend Integration, CDS Views & Fiori Elements, SAP BTP (preferred).",
  type: "full_time",
  category: "IT & Software",
  experienceLevel: "senior",
  role: "Full Stack Developer",
  industryType: "IT Services & Consulting",
  department: "Engineering - Software & QA",
  roleCategory: "Software Development",
  educationUG: "Any Graduate",
  educationPG: "Any Postgraduate",
  openings: 10,
  skills: ["SAP Fiori", "SAP Gateway", "Odata", "SAP Fiori UI5", "OO ABAP"],
  location: "Bengaluru & Navi Mumbai, India",
  isRemote: false,
  // Source listing shows "Not Disclosed" — left at 0 rather than guessing a
  // number, which JobDetails.tsx already treats as "no salary range shown".
  salaryMin: 0,
  salaryMax: 0,
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
  assertNotProduction("seedTcsFioriJob");
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
