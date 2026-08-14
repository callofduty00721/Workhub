import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db.js";
import Plan from "../../src/modules/finance/plan.model.js";

// Draft pricing — admins can edit every field of every row afterward from
// Admin > Plans (backend/src/modules/admin/plans.js). This just seeds a
// starting point so the (role, tier) matrix isn't empty on a fresh DB.
// priceInInrYearly is monthly x10 (2 months free) — the standard annual-
// discount convention — for every paid tier; free tiers stay 0 either way.
const PLANS = [
  { role: "founder", tier: "free", name: "Free", priceInInr: 0, priceInInrYearly: 0, features: ["1 startup listing", "Basic profile"], maxListings: 1 },
  {
    role: "founder",
    tier: "pro",
    name: "Pro",
    priceInInr: 999,
    priceInInrYearly: 9990,
    features: ["3 startup listings", "Featured placement", "10 investor pitches/month"],
    maxListings: 3,
  },
  {
    role: "founder",
    tier: "enterprise",
    name: "Enterprise",
    priceInInr: 2999,
    priceInInrYearly: 29990,
    features: ["Unlimited startups", "Top placement", "Unlimited investor pitches", "Dedicated support"],
    maxListings: -1,
  },

  { role: "employer", tier: "free", name: "Free", priceInInr: 0, priceInInrYearly: 0, features: ["2 active job posts"], maxListings: 2 },
  {
    role: "employer",
    tier: "pro",
    name: "Pro",
    priceInInr: 1499,
    priceInInrYearly: 14990,
    features: ["10 job posts", "Candidate contact unlock", "Featured jobs"],
    maxListings: 10,
  },
  {
    role: "employer",
    tier: "enterprise",
    name: "Enterprise",
    priceInInr: 4999,
    priceInInrYearly: 49990,
    features: ["Unlimited job posts", "Bulk hiring tools", "Dedicated account manager"],
    maxListings: -1,
  },

  { role: "client", tier: "free", name: "Free", priceInInr: 0, priceInInrYearly: 0, features: ["2 active project posts"], maxListings: 2 },
  {
    role: "client",
    tier: "pro",
    name: "Pro",
    priceInInr: 999,
    priceInInrYearly: 9990,
    features: ["10 project posts", "Priority proposals"],
    maxListings: 10,
  },
  {
    role: "client",
    tier: "enterprise",
    name: "Enterprise",
    priceInInr: 2999,
    priceInInrYearly: 29990,
    features: ["Unlimited project posts", "Dedicated support"],
    maxListings: -1,
  },

  { role: "investor", tier: "free", name: "Free", priceInInr: 0, priceInInrYearly: 0, features: ["5 founder contacts/month"] },
  {
    role: "investor",
    tier: "pro",
    name: "Pro",
    priceInInr: 1999,
    priceInInrYearly: 19990,
    features: ["25 founder contacts/month", "Deal alerts"],
  },
  {
    role: "investor",
    tier: "enterprise",
    name: "Enterprise",
    priceInInr: 4999,
    priceInInrYearly: 49990,
    features: ["Unlimited founder contacts", "Early access to new startups", "Curated deal flow"],
  },

  { role: "freelancer", tier: "free", name: "Free", priceInInr: 0, priceInInrYearly: 0, features: ["Unlimited gigs", "Basic profile"] },
  {
    role: "freelancer",
    tier: "pro",
    name: "Pro",
    priceInInr: 299,
    priceInInrYearly: 2990,
    features: ["Priority visibility", "Featured profile", "Lower commission"],
  },
  {
    role: "freelancer",
    tier: "enterprise",
    name: "Enterprise",
    priceInInr: 799,
    priceInInrYearly: 7990,
    features: ["Top placement", "Verified badge priority", "Lowest commission"],
  },

  { role: "job_seeker", tier: "free", name: "Free", priceInInr: 0, priceInInrYearly: 0, features: ["Unlimited applications"] },
  {
    role: "job_seeker",
    tier: "pro",
    name: "Pro",
    priceInInr: 199,
    priceInInrYearly: 1990,
    features: ["Featured profile", "Resume highlight"],
  },
  {
    role: "job_seeker",
    tier: "enterprise",
    name: "Enterprise",
    priceInInr: 499,
    priceInInrYearly: 4990,
    features: ["Top of search", "Direct recruiter visibility"],
  },

  { role: "mentor", tier: "free", name: "Free", priceInInr: 0, priceInInrYearly: 0, features: ["Basic listing"] },
  { role: "mentor", tier: "pro", name: "Pro", priceInInr: 299, priceInInrYearly: 2990, features: ["Featured listing", "More sessions/month"] },
  {
    role: "mentor",
    tier: "enterprise",
    name: "Enterprise",
    priceInInr: 799,
    priceInInrYearly: 7990,
    features: ["Top placement", "Unlimited sessions"],
  },

  { role: "partner", tier: "free", name: "Free", priceInInr: 0, priceInInrYearly: 0, features: ["Basic listing"] },
  { role: "partner", tier: "pro", name: "Pro", priceInInr: 299, priceInInrYearly: 2990, features: ["Featured listing"] },
  {
    role: "partner",
    tier: "enterprise",
    name: "Enterprise",
    priceInInr: 799,
    priceInInrYearly: 7990,
    features: ["Top placement", "Priority support"],
  },

  { role: "influencer", tier: "free", name: "Free", priceInInr: 0, priceInInrYearly: 0, features: ["Basic profile"] },
  {
    role: "influencer",
    tier: "pro",
    name: "Pro",
    priceInInr: 299,
    priceInInrYearly: 2990,
    features: ["Featured profile", "Higher campaign visibility"],
  },
  {
    role: "influencer",
    tier: "enterprise",
    name: "Enterprise",
    priceInInr: 799,
    priceInInrYearly: 7990,
    features: ["Top placement", "Priority campaign matching"],
  },
];

async function run() {
  await connectDB();

  let created = 0;
  let skipped = 0;
  for (const p of PLANS) {
    const res = await Plan.updateOne({ role: p.role, tier: p.tier }, { $setOnInsert: p }, { upsert: true });
    if (res.upsertedCount) created++;
    else skipped++;
  }

  console.log(`Plans seeded: ${created} created, ${skipped} already existed (left untouched).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
