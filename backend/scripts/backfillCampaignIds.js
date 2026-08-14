// One-time backfill for campaigns created before the campaignId field
// existed — the model's pre("save") hook only assigns it for new documents
// (isNew), so anything already in the DB needs this run once.
import "dotenv/config";
import mongoose from "mongoose";
import crypto from "crypto";
import { connectDB } from "../src/config/db.js";
import Campaign from "../src/modules/campaign/campaign.model.js";

const CAMPAIGN_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCampaignCode() {
  let code = "";
  for (let i = 0; i < 6; i += 1) code += CAMPAIGN_ID_CHARS[crypto.randomInt(CAMPAIGN_ID_CHARS.length)];
  return `CMP-${code}`;
}

async function run() {
  await connectDB();

  const missing = await Campaign.find({ $or: [{ campaignId: { $exists: false } }, { campaignId: null }] }).select("_id");
  console.log(`Found ${missing.length} campaign(s) without a campaignId.`);

  let assigned = 0;
  for (const c of missing) {
    let candidate;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      candidate = randomCampaignCode();
      // eslint-disable-next-line no-await-in-loop
      const exists = await Campaign.exists({ campaignId: candidate });
      if (!exists) break;
      candidate = null;
    }
    if (!candidate) {
      console.warn(`Could not find a unique code for campaign ${c._id} after 5 attempts — skipped.`);
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    await Campaign.updateOne({ _id: c._id }, { $set: { campaignId: candidate } });
    assigned += 1;
  }

  console.log(`Assigned campaignId to ${assigned} campaign(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
