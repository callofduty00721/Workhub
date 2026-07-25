import mongoose from "mongoose";

const PACKAGE_NAMES = ["basic", "standard", "premium"];

const servicePackageSchema = new mongoose.Schema(
  {
    name: { type: String, enum: PACKAGE_NAMES, required: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 1 },
    deliveryDays: { type: Number, required: true, min: 1 },
    // -1 is a sentinel for "unlimited" revisions, checked explicitly wherever
    // this is compared against revisionsUsed (see paymentController.requestRevision).
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
    status: { type: String, enum: ["active", "paused"], default: "active" },
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
