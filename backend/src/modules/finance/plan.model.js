import mongoose from "mongoose";

// One doc per (role, tier) — 9 roles x 3 tiers = 27 docs, seeded by
// backend/scripts/seed/seedPlans.js. Editable by admin (see
// backend/src/modules/admin/plans.js), read publicly by role (see
// backend/src/modules/finance/plan.routes.js) for the Pricing page and checkout.
export const PLAN_ROLES = [
  "founder",
  "freelancer",
  "job_seeker",
  "influencer",
  "employer",
  "investor",
  "mentor",
  "partner",
  "client",
];

export const PLAN_TIERS = ["free", "pro", "enterprise"];

const planSchema = new mongoose.Schema(
  {
    role: { type: String, enum: PLAN_ROLES, required: true },
    tier: { type: String, enum: PLAN_TIERS, required: true },
    name: { type: String, required: true },
    priceInInr: { type: Number, required: true, min: 0 },
    features: [{ type: String }],
    // Machine-enforced cap on active listings this plan allows (startups for
    // founder, job posts for employer, project posts for client) — -1 means
    // unlimited. Not meaningful for every role (e.g. freelancer plans are
    // about visibility, not a listing count), so it just stays -1 there.
    // Checked by backend/src/utils/planLimits.js at creation time.
    maxListings: { type: Number, default: -1 },
  },
  { timestamps: true }
);

planSchema.index({ role: 1, tier: 1 }, { unique: true });

export default mongoose.model("Plan", planSchema);
