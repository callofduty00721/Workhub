// One-time migration — Campaign.platform (single String) was replaced with
// Campaign.platforms (String[]) so a campaign can run across more than one
// platform at once. Existing documents still have the old field sitting in
// Mongo (Mongoose just ignores it now, since it's no longer in the schema);
// this copies it over to the new field and removes the old one.
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import Campaign from "../src/modules/campaign/campaign.model.js";

async function run() {
  await connectDB();

  const raw = mongoose.connection.collection("campaigns");
  const legacy = await raw.find({ platform: { $exists: true } }).toArray();
  console.log(`Found ${legacy.length} campaign(s) with the old single "platform" field.`);

  let migrated = 0;
  for (const doc of legacy) {
    const platforms = doc.platforms?.length ? doc.platforms : doc.platform ? [doc.platform] : ["instagram"];
    // eslint-disable-next-line no-await-in-loop
    await raw.updateOne({ _id: doc._id }, { $set: { platforms }, $unset: { platform: "" } });
    migrated += 1;
  }

  console.log(`Migrated ${migrated} campaign(s) to platforms[].`);

  const stillMissing = await Campaign.countDocuments({ platforms: { $exists: false } });
  if (stillMissing > 0) {
    console.log(`${stillMissing} campaign(s) still have no platforms at all — defaulting them to ["instagram"].`);
    await raw.updateMany({ platforms: { $exists: false } }, { $set: { platforms: ["instagram"] } });
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
