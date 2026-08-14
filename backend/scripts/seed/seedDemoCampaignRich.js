// Seeds one fully-filled-out demo campaign so every new Campaign field
// (cover image, highlights, terms, target audience, collaboration type,
// payment mode, featured flag, etc.) has something real to render on the
// /campaigns card + details page — same idempotent upsert pattern as
// seedDemoBusinessProfiles.js.
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import { assertNotProduction } from "../../src/utils/seedGuard.js";
import User from "../../src/modules/shared/user.model.js";
import Campaign from "../../src/modules/campaign/campaign.model.js";

const PASSWORD = "Demo@12345";

async function run() {
  assertNotProduction("seedDemoCampaignRich");
  await connectDB();

  let brand = await User.findOne({ email: "brand.glowveda@growhive.test" });
  if (!brand) {
    brand = await User.create({
      name: "GlowVeda Naturals",
      email: "brand.glowveda@growhive.test",
      password: PASSWORD,
      role: "brand",
      roles: ["brand"],
      selectedCategory: "hiring",
      headline: "Ayurvedic skincare, made fresh",
      location: "Mumbai, Maharashtra",
      bio: "GlowVeda makes small-batch Ayurvedic skincare — turmeric, saffron, and other traditional ingredients, reformulated for everyday use.",
      isVerified: true,
      isEmailVerified: true,
      isProfileComplete: true,
      brandProfile: {
        industry: "Beauty & Personal Care",
        website: "https://glowveda.example.com",
        followerCount: 84000,
        products: [{ name: "Ubtan Face Wash", description: "Turmeric & Saffron face wash for natural glow", imageUrl: "" }],
      },
    });
    console.log(`Created brand "${brand.name}" (${brand._id})`);
  }
  // Set directly (not through the API) so the card/details page has a
  // realistic rating/verified badge to show — this bypasses nothing a real
  // user-facing endpoint enforces, since it's just seed data.
  brand.isVerified = true;
  brand.rating = 4.8;
  brand.reviewCount = 120;
  await brand.save();

  const applicationDeadline = new Date(Date.now() + 5 * 86_400_000 + 12 * 3_600_000);

  let campaign = await Campaign.findOne({ employer: brand._id, title: "Ubtan Face Wash Campaign" });
  if (!campaign) {
    campaign = new Campaign({ employer: brand._id });
    console.log("Creating campaign \"Ubtan Face Wash Campaign\"");
  } else {
    console.log("Campaign already exists — refreshing its fields");
  }

  Object.assign(campaign, {
    title: "Ubtan Face Wash Campaign",
    companyName: brand.name,
    description:
      "We are launching our new Ubtan Face Wash with the goodness of Turmeric & Saffron. Help us spread the word by creating engaging reels and stories that highlight the benefits of natural skincare.",
    platforms: ["instagram", "youtube"],
    influencerCategory: "Beauty",
    niche: "Skincare",
    deliverables: [
      "Instagram Reel (15 – 60 sec)",
      "Instagram Story (2 – 3 frames)",
      "Usage of required Hashtags & Mentions",
      "Product Tag & Brand Mention",
      "Content should be original and authentic",
    ].join("\n"),
    minFollowers: 10000,
    minEngagementRate: 3,
    location: "India (All Major Cities)",
    budgetMin: 200000,
    budgetMax: 200000,
    currency: "INR",
    status: "open",
    collaboratorsMin: 20,
    collaboratorsMax: 30,
    startDate: new Date("2026-09-10"),
    endDate: new Date("2026-09-25"),
    applicationDeadline,
    targetAgeMin: 18,
    targetAgeMax: 35,
    estimatedReachMin: 2_000_000,
    estimatedReachMax: 5_000_000,
    collaborationType: "paid",
    paymentMode: "bank_transfer",
    highlights: ["Increase brand awareness", "Boost product sales", "Drive website traffic", "Engage with skincare lovers"],
    termsAndConditions: [
      "Content should be original and non-plagiarized.",
      "Mandatory to follow hashtags & mentions.",
      "Brand has the right to repurpose the content.",
      "Payment will be released after content approval.",
    ].join("\n"),
    // No imageUrl — left blank on purpose rather than hotlinking someone
    // else's product photo; the card/details page falls back to a flat
    // platform-color banner, which is a real, normal state of the page.
    isFeatured: true,
  });
  await campaign.save();

  console.log(`\nCampaign ready: /campaigns/${campaign._id}`);
  console.log(`Login as the brand: ${brand.email} / ${PASSWORD}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
