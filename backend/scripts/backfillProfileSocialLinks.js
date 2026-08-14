// One-time migration — brandProfile.instagramUrl/youtubeUrl/facebookUrl
// (three hardcoded fields) were replaced with brandProfile.socialLinks
// ([{platform, url}]) so a brand can add any platform, not just those
// three, without a schema change. Copies over any existing values and
// removes the old fields.
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import User from "../src/modules/shared/user.model.js";

async function run() {
  await connectDB();

  const raw = mongoose.connection.collection("users");
  const legacy = await raw
    .find({
      $or: [
        { "brandProfile.instagramUrl": { $exists: true } },
        { "brandProfile.youtubeUrl": { $exists: true } },
        { "brandProfile.facebookUrl": { $exists: true } },
      ],
    })
    .toArray();

  console.log(`Found ${legacy.length} brand(s) with the old hardcoded social fields.`);

  let migrated = 0;
  for (const doc of legacy) {
    const bp = doc.brandProfile || {};
    const socialLinks = Array.isArray(bp.socialLinks) ? [...bp.socialLinks] : [];
    if (bp.instagramUrl) socialLinks.push({ platform: "Instagram", url: bp.instagramUrl });
    if (bp.youtubeUrl) socialLinks.push({ platform: "YouTube", url: bp.youtubeUrl });
    if (bp.facebookUrl) socialLinks.push({ platform: "Facebook", url: bp.facebookUrl });

    // eslint-disable-next-line no-await-in-loop
    await raw.updateOne(
      { _id: doc._id },
      {
        $set: { "brandProfile.socialLinks": socialLinks },
        $unset: { "brandProfile.instagramUrl": "", "brandProfile.youtubeUrl": "", "brandProfile.facebookUrl": "" },
      }
    );
    migrated += 1;
  }

  console.log(`Migrated ${migrated} brand(s) to brandProfile.socialLinks[].`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
