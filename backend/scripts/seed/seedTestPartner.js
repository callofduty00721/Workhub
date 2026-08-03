import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import User from "../../src/modules/shared/user.model.js";

const DEMO_PASSWORD = "Demo@12345";

const PARTNER = {
  name: "Anjali Rao",
  email: "anjali.rao@mahahub.demo",
  organizationName: "Sahyadri Startup Accelerator",
  partnerType: "accelerator",
  programDetails: "A 12-week accelerator program for early-stage startups across Maharashtra, offering mentorship, seed funding connections, and office space.",
  startupsSupportedCount: 24,
  applicationLink: "https://sahyadriaccelerator.example.com/apply",
  location: "Pune, Maharashtra, India",
};

async function run() {
  await connectDB();
  let user = await User.findOne({ email: PARTNER.email });
  if (!user) {
    user = new User({ ...PARTNER, role: "partner", password: DEMO_PASSWORD, isEmailVerified: true, isProfileComplete: true });
    await user.save();
    console.log(`Created partner: ${PARTNER.name}`);
  } else {
    console.log(`Reusing existing partner: ${PARTNER.name}`);
  }
  await mongoose.connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
