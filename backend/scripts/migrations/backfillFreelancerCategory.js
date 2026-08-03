import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import User from "../../src/modules/shared/user.model.js";

const UPDATES = [
  { email: "aditi.kulkarni@mahahub.demo", category: "Graphics & Design", subCategory: "Logo & Brand Identity" },
  { email: "rohan.sharma@mahahub.demo", category: "Programming & Tech", subCategory: "Website Development" },
  { email: "sarah.fernandes@mahahub.demo", category: "Writing & Translation", subCategory: "Content Writing" },
];

async function run() {
  await connectDB();

  for (const { email, category, subCategory } of UPDATES) {
    const result = await User.updateOne({ email }, { $set: { category, subCategory } });
    console.log(`${email}: ${result.matchedCount ? "updated" : "not found"}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
