import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import User from "../src/models/User.js";

// One-time migration: "job_seeker" was merged into "freelancer" — Job Seeker
// carried no role-specific profile data, so this is a pure relabeling with
// nothing to reconcile. Existing Applications are keyed by user ID, not role,
// so they remain intact automatically.
async function run() {
  await connectDB();

  const result = await User.updateMany({ role: "job_seeker" }, { $set: { role: "freelancer" } });
  console.log(`Migrated ${result.modifiedCount} job_seeker account(s) to freelancer.`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
