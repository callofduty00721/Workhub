import mongoose from "mongoose";

const PACKAGE_NAMES = ["basic", "standard", "premium"];
const EXPERIENCE_LEVELS = ["beginner", "intermediate", "expert"];

const extraSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const servicePackageSchema = new mongoose.Schema(
  {
    name: { type: String, enum: PACKAGE_NAMES, required: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 1 },
    deliveryDays: { type: Number, required: true, min: 1 },
    // -1 is a sentinel for "unlimited" revisions, checked explicitly wherever
    // this is compared against revisionsUsed (see payment/orderLifecycle.requestRevision).
    revisions: { type: Number, default: 1, min: -1 },
    features: [{ type: String }],
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Set from the freelancer's User.company at creation time — lets other
    // members of the same agency/team jointly manage this gig and its
    // orders, the same way Job.company works for Employer teams.
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, default: "" },
    priceType: { type: String, enum: ["fixed", "hourly"], default: "fixed" },
    price: { type: Number, required: true, min: 0 },
    deliveryDays: { type: Number, default: 3 },
    // Same -1-means-unlimited sentinel as servicePackageSchema.revisions —
    // only used when the gig has no package tiers (flat price).
    revisions: { type: Number, default: 1, min: -1 },
    // Optional Basic/Standard/Premium tiers — when present, a buyer picks one
    // of these at order time instead of paying the flat `price` above.
    packages: [servicePackageSchema],
    skills: [{ type: String }],
    images: [{ type: String }],
    video: { type: String, default: "" },
    liveDemoUrl: { type: String, default: "" },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, default: "beginner" },
    languages: [{ type: String }],
    // Optional paid add-ons a buyer can tick at order time (e.g. "Express
    // Delivery" for an extra ₹5,000) — not wired into the order/payment flow
    // yet, just captured on the gig itself for now.
    extras: [extraSchema],
    // "private" behaves like "active" except listServices/getFreelancerProfile
    // (both filtered to status:"active") exclude it — only reachable via a
    // direct link, since getServiceById never filters by status.
    status: { type: String, enum: ["active", "private", "paused", "draft"], default: "active" },
    // Search keywords surfaced to buyers — distinct from `skills` (the
    // freelancer's own tech-stack tags): seeded from skills but independently
    // editable, capped at 15 on the frontend.
    tags: [{ type: String }],
    // This gig's committed reply-time SLA to buyers — distinct from the
    // freelancer's overall profile-level User.responseTimeLabel.
    responseTime: {
      type: String,
      enum: ["Within 1 Hour", "Within a few hours", "Within a day", "Within 2 days"],
      default: "Within a day",
    },
    cancellationPolicy: { type: String, enum: ["Flexible", "Standard", "Strict"], default: "Standard" },
    ordersCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const PACKAGE_NAME_VALUES = PACKAGE_NAMES;

serviceSchema.index({ title: "text", category: "text", skills: "text" });

export default mongoose.model("Service", serviceSchema);
