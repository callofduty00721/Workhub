import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import { assertNotProduction } from "../../src/utils/seedGuard.js";
import User from "../../src/modules/shared/user.model.js";
import Campaign from "../../src/modules/campaign/campaign.model.js";
import Application from "../../src/modules/shared/application.model.js";
import Payment from "../../src/modules/shared/payment.model.js";
import Review from "../../src/modules/shared/review.model.js";
import TalentRoster from "../../src/modules/campaign/talentRoster.model.js";

const PASSWORD = "Demo@12345";

async function upsertUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    console.log(`"${data.name}" already exists — skipped.`);
    return existing;
  }
  const user = await User.create({ ...data, password: PASSWORD, isEmailVerified: true, isProfileComplete: true });
  console.log(`Created ${user.role} "${user.name}" (${user._id})`);
  return user;
}

async function run() {
  assertNotProduction("seedDemoBusinessProfiles");
  await connectDB();

  // 1. Brand
  const brand = await upsertUser({
    name: "Zeal Sportswear",
    email: "brand.demo@growhive.test",
    role: "brand",
    roles: ["brand"],
    selectedCategory: "hiring",
    headline: "Athleisure & performance sportswear, made in India",
    location: "Mumbai, Maharashtra",
    bio: "Zeal makes running shoes and athleisure for everyday Indian athletes — we partner with fitness and lifestyle creators who actually train in our gear.",
    brandProfile: {
      industry: "Sportswear & Fitness",
      website: "https://zealsportswear.example.com",
      followerCount: 62000,
      products: [
        { name: "Zeal Air Runner", description: "Lightweight daily-trainer running shoe", imageUrl: "" },
        { name: "Zeal FlexFit Leggings", description: "4-way stretch training leggings", imageUrl: "" },
      ],
      influencerRequirements: [
        { category: "Fitness & Health", minFollowers: 20000, platforms: ["Instagram", "YouTube"], location: "Mumbai", notes: "Reels showing real workouts, not just unboxings" },
      ],
      pastCollaborations: [{ brandName: "Self", description: "Launch campaign for Zeal Air Runner", resultMetric: "1.2M reach across 8 creators" }],
    },
  });

  // 2. Agency
  const agency = await upsertUser({
    name: "Pulse Digital Agency",
    email: "agency.demo@growhive.test",
    role: "agency",
    roles: ["agency"],
    selectedCategory: "hiring",
    headline: "Full-funnel influencer marketing for D2C brands",
    location: "Bengaluru, Karnataka",
    bio: "Pulse runs influencer campaigns end-to-end for D2C brands — creator sourcing, briefing, content review, and reporting.",
    agencyProfile: {
      agencyType: "Full-service influencer marketing agency",
      website: "https://pulsedigital.example.com",
      teamSize: 18,
      services: ["influencer_marketing", "social_media_marketing", "content_production", "pr"],
      clients: [
        { clientName: "Brewhouse Coffee Co.", logoUrl: "", description: "Ran their 2025 monsoon campaign, 40+ creators" },
        { clientName: "Nutriva Foods", logoUrl: "", description: "Ongoing always-on creator program" },
      ],
      pastCampaigns: [{ brandName: "Brewhouse Monsoon Push", description: "Multi-platform creator campaign", resultMetric: "5.4M reach, 3.1% avg engagement" }],
    },
  });

  // 3. Talent Partner
  const talentPartner = await upsertUser({
    name: "Nova Creator Management",
    email: "talentpartner.demo@growhive.test",
    role: "talent_partner",
    roles: ["talent_partner"],
    selectedCategory: "hiring",
    headline: "Talent management for food, fitness, and lifestyle creators",
    location: "New Delhi, Delhi",
    bio: "Nova represents a small, hand-picked roster of creators — we handle brand deals, negotiation, and scheduling so they can focus on making content.",
    talentPartnerProfile: {
      partnerType: "Talent Manager",
      website: "https://novacreators.example.com",
      services: ["Brand Deal Negotiation", "Content Calendar Management", "PR & Media Requests"],
      brandPartnerships: [{ clientName: "Zeal Sportswear", logoUrl: "", description: "Placed 2 creators for their shoe launch" }],
    },
  });

  // 4. Influencer
  const influencer = await upsertUser({
    name: "Meera Iyer",
    email: "meera.influencer@growhive.test",
    role: "influencer",
    roles: ["influencer"],
    selectedCategory: "talent",
    headline: "Fitness & running creator — training logs, gear reviews, race day vlogs",
    location: "Chennai, Tamil Nadu",
    bio: "I post real training logs, honest gear reviews, and race-day vlogs — no fad workouts, just consistent running content.",
    isVerified: true,
    influencerProfile: {
      category: "Sports",
      niche: "Fitness & Training",
      mediaKitUrl: "",
      platforms: [
        { platform: "Instagram", handle: "@meera.runs", followers: 47000, url: "https://instagram.com/meera.runs" },
        { platform: "YouTube", handle: "Meera Iyer Running", followers: 12500, url: "https://youtube.com/@meeraiyerrunning" },
      ],
      rateCard: [
        { platform: "Instagram", contentType: "Reel", priceInInr: 9000 },
        { platform: "YouTube", contentType: "Dedicated video", priceInInr: 22000 },
      ],
      pastCollaborations: [{ brandName: "TrailBlaze Shoes", description: "3-part half-marathon training series", resultMetric: "220K views" }],
      contentSamples: [{ url: "https://instagram.com/reel/example-meera-1", caption: "My 12-week half marathon build-up" }],
    },
  });

  // --- Relationships, so the profiles aren't empty shells ---

  // Brand's campaign, applied to and hired by Meera, paid via released escrow
  // (so Meera's "Campaigns Completed" and matchScore reflect a real payment).
  let campaign = await Campaign.findOne({ employer: brand._id, title: "Zeal Air Runner Launch" });
  if (!campaign) {
    campaign = await Campaign.create({
      employer: brand._id,
      title: "Zeal Air Runner Launch",
      companyName: brand.name,
      description: "Looking for fitness creators to showcase the new Zeal Air Runner in a real training run.",
      platforms: ["instagram", "youtube"],
      deliverables: "1 Reel + 3 Stories",
      influencerCategory: "Fitness & Health",
      minFollowers: 20000,
      location: "Mumbai",
      budgetMin: 8000,
      budgetMax: 12000,
      status: "open",
    });
    console.log(`Created campaign "${campaign.title}"`);
  }

  let application = await Application.findOne({ job: campaign._id, applicant: influencer._id });
  if (!application) {
    application = await Application.create({
      onModel: "Campaign",
      job: campaign._id,
      applicant: influencer._id,
      coverLetter: "I run 30-40km a week and would love to feature the Air Runner in my next training log.",
      proposedRate: 9000,
      deliveryDays: 7,
      status: "hired",
    });
    campaign.applicationsCount += 1;
    await campaign.save();
    console.log("Created + hired application for Meera on Zeal's campaign");
  }

  const existingPayment = await Payment.findOne({ application: application._id, type: "campaign" });
  if (!existingPayment) {
    await Payment.create({
      payer: brand._id,
      payee: influencer._id,
      type: "campaign",
      amount: 9000,
      currency: "INR",
      provider: "razorpay",
      providerOrderId: `seed_${application._id}`,
      providerPaymentId: `seed_pay_${application._id}`,
      status: "paid",
      escrowStatus: "released",
      releasedAt: new Date(),
      application: application._id,
      note: campaign.title,
      commissionPercent: 10,
      commissionAmount: 900,
      netAmount: 8100,
    });
    console.log("Created released campaign payment (Meera's Campaigns Completed = 1)");
  }

  // Agency's own campaign (so Agency's public Campaigns tab has something).
  const agencyCampaignExists = await Campaign.findOne({ employer: agency._id, title: "Brewhouse Monsoon Refresh" });
  if (!agencyCampaignExists) {
    await Campaign.create({
      employer: agency._id,
      title: "Brewhouse Monsoon Refresh",
      companyName: "Brewhouse Coffee Co. (via Pulse Digital Agency)",
      description: "Seeking lifestyle creators for a monsoon-themed coffee campaign — cozy, rainy-day content.",
      platforms: ["instagram"],
      deliverables: "1 Reel + 1 Carousel",
      influencerCategory: "Food & Lifestyle",
      minFollowers: 15000,
      location: "Bengaluru",
      budgetMin: 6000,
      budgetMax: 10000,
      status: "open",
    });
    console.log('Created campaign "Brewhouse Monsoon Refresh" for the agency');
  }

  // Talent Partner's roster — Meera has already accepted (consent-gated, see
  // talentRoster.model.js — this seed represents a relationship where
  // consent was already given, not a bypass of the invite/accept flow).
  const existingRoster = await TalentRoster.findOne({ partner: talentPartner._id, influencer: influencer._id });
  if (!existingRoster) {
    await TalentRoster.create({
      partner: talentPartner._id,
      influencer: influencer._id,
      status: "accepted",
      message: "We'd love to manage your brand deals — you already have great engagement on your running content.",
      respondedAt: new Date(),
    });
    console.log("Added Meera to Nova Creator Management's roster (accepted)");
  }

  // A review, so the Reviews section on both Zeal's and Meera's profiles has content.
  const existingReview = await Review.findOne({ reviewer: brand._id, targetType: "user", targetId: influencer._id });
  if (!existingReview) {
    await Review.create({
      reviewer: brand._id,
      targetType: "user",
      targetId: influencer._id,
      rating: 5,
      comment: "Meera delivered exactly what we briefed, on time, and the content felt authentic to her usual posts. Would hire again.",
    });
    const agg = await Review.aggregate([
      { $match: { targetType: "user", targetId: influencer._id } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    influencer.rating = agg[0] ? Math.round(agg[0].avgRating * 10) / 10 : 0;
    influencer.reviewCount = agg[0]?.count ?? 0;
    await influencer.save();
    console.log("Added Zeal's review of Meera");
  }

  console.log("\nDemo logins (same password for all):");
  for (const u of [brand, agency, talentPartner, influencer]) console.log(`  ${u.email}  (${u.role})`);
  console.log(`  Password: ${PASSWORD}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
