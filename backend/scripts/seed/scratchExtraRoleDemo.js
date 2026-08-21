// One-off, throwaway script — creates minimal @growhive.demo test accounts
// for the roles seedDemoContent.js doesn't cover, purely so the responsive
// layout of their dashboards can be checked in a browser. Not wired into any
// npm script; safe to delete after use.
import "dotenv/config";
import { connectDB } from "../../src/config/db.js";
import { assertNotProduction } from "../../src/utils/seedGuard.js";
import User from "../../src/modules/shared/user.model.js";
import mongoose from "mongoose";

const DEMO_PASSWORD = "Demo@12345";

const EXTRA_USERS = [
  { name: "Sameer Kale", email: "sameer.kale@growhive.demo", role: "founder", headline: "Founder, TestLaunch", location: "Pune, Maharashtra, India" },
  { name: "Neha Verma", email: "neha.verma@growhive.demo", role: "investor", headline: "Partner, TestCap Ventures", location: "Mumbai, Maharashtra, India" },
  { name: "Arjun Rao", email: "arjun.rao@growhive.demo", role: "mentor", headline: "Product Mentor", location: "Bengaluru, Karnataka, India" },
  { name: "Kavita Nair", email: "kavita.nair@growhive.demo", role: "partner", headline: "Startup Partner", location: "Chennai, Tamil Nadu, India" },
  { name: "Isha Malhotra", email: "isha.malhotra@growhive.demo", role: "influencer", headline: "Lifestyle Creator", location: "Delhi, India" },
  { name: "Karan Mehta", email: "karan.mehta@growhive.demo", role: "brand", headline: "Marketing Lead, TestBrand", location: "Pune, Maharashtra, India" },
  { name: "Divya Pillai", email: "divya.pillai@growhive.demo", role: "agency", headline: "Agency Lead, TestAgency", location: "Bengaluru, Karnataka, India" },
  { name: "Ritesh Gupta", email: "ritesh.gupta@growhive.demo", role: "talent_partner", headline: "Talent Partner, TestRoster", location: "Mumbai, Maharashtra, India" },
  { name: "Pooja Iyer", email: "pooja.iyer@growhive.demo", role: "job_seeker", headline: "Aspiring Product Manager", location: "Hyderabad, Telangana, India" },
];

async function run() {
  assertNotProduction("scratchExtraRoleDemo");
  await connectDB();
  for (const data of EXTRA_USERS) {
    let user = await User.findOne({ email: data.email });
    if (!user) {
      user = new User({ ...data, password: DEMO_PASSWORD, isEmailVerified: true, isProfileComplete: true });
      await user.save();
      console.log(`Created ${data.role}: ${data.name}`);
    } else {
      console.log(`Reusing existing ${data.role}: ${data.name}`);
    }
  }
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
