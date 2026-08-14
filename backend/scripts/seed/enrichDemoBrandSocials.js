// Fills in the social/website fields on the existing GlowVeda Naturals demo
// brand (seedDemoCampaignRich.js) so its card on /brands shows every field
// the current DirectoryCard supports: logo, tagline, industry, website,
// Instagram/YouTube/Facebook icons, open-campaigns count, follower count.
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import { assertNotProduction } from "../../src/utils/seedGuard.js";
import User from "../../src/modules/shared/user.model.js";

async function run() {
  assertNotProduction("enrichDemoBrandSocials");
  await connectDB();

  const brand = await User.findOne({ email: "brand.glowveda@growhive.test" });
  if (!brand) {
    console.error('GlowVeda Naturals not found — run seedDemoCampaignRich.js first.');
    process.exit(1);
  }

  brand.brandProfile.instagramUrl = "https://instagram.com/glowveda.naturals";
  brand.brandProfile.youtubeUrl = "https://youtube.com/@glowvedanaturals";
  brand.brandProfile.facebookUrl = "https://facebook.com/glowveda.naturals";
  await brand.save();

  console.log(`Updated "${brand.name}" (${brand._id}) with Instagram/YouTube/Facebook links.`);
  console.log(`View it at /brands/${brand._id}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
