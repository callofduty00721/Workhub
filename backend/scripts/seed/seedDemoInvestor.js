import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import User from "../../src/modules/shared/user.model.js";

const INVESTOR_EMAIL = "investor.demo@mahahub.test";
const INVESTOR_PASSWORD = "Demo@12345";

async function run() {
  await connectDB();

  let investor = await User.findOne({ email: INVESTOR_EMAIL });
  if (investor) {
    console.log("Demo investor already exists.");
  } else {
    investor = await User.create({
      name: "Anita Mehta",
      email: INVESTOR_EMAIL,
      password: INVESTOR_PASSWORD,
      role: "investor",
      headline: "Early-stage investor focused on rural & agri-tech startups",
      location: "Mumbai, Maharashtra",
      bio: "Investing in founders solving real problems for Bharat.",
      investmentFocus: ["Agriculture", "Clean Energy", "Education"],
      ticketSizeMin: 50000,
      ticketSizeMax: 1000000,
      portfolioCompanyCount: 4,
      isEmailVerified: true,
      isProfileComplete: true,
    });
    console.log(`Created "${investor.name}" (${investor._id})`);
  }

  console.log("\nDemo investor login:");
  console.log(`  Email:    ${INVESTOR_EMAIL}`);
  console.log(`  Password: ${INVESTOR_PASSWORD}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
