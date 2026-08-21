import mongoose from "mongoose";

const PROJECT_TYPES = ["freelance", "contract"];
const VISIBILITY_VALUES = ["public", "invite_only"];

// Projects are always bid-based (freelancers propose their own rate/delivery
// per application — see Application.proposedRate/deliveryDays) — kept as its
// own collection, separate from Job (salaried employment), since it never
// needs experienceLevel/salaryMin-as-salary semantics Job carries.
const projectSchema = new mongoose.Schema(
  {
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    title: { type: String, required: true, trim: true },
    companyName: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String, default: "" },
    type: { type: String, enum: PROJECT_TYPES, default: "freelance" },
    // Same Category -> Sub-category skill taxonomy as Service/User (see
    // SERVICE_CATEGORIES in the frontend) — free-form strings rather than an
    // enum since the taxonomy lives in frontend/src/lib/mockData.ts, not here.
    category: { type: String, default: "" },
    subCategory: { type: String, default: "" },
    skills: [{ type: String }],
    location: { type: String, required: true },
    isRemote: { type: Boolean, default: false },
    // Indicative only — the freelancer still proposes their own rate and
    // delivery time per application, same as a Fiverr/Upwork "budget" guide.
    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 0 },
    expectedDeliveryDays: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["open", "closed", "draft"], default: "open" },
    // Set only by scripts/seed/seedDemoContent.js — lets marketplace cards
    // show a "Demo" badge on seeded content instead of passing it off as a
    // real listing, since the platform has no real users yet.
    isDemo: { type: Boolean, default: false },
    applicationsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },

    visibility: { type: String, enum: VISIBILITY_VALUES, default: "public" },
    invitedFreelancers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    requiresNda: { type: Boolean, default: false },
    ndaText: { type: String, default: "" },
    ndaAcceptances: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        acceptedAt: { type: Date, default: Date.now },
      },
    ],
    attachments: [{ key: { type: String, required: true }, name: { type: String, default: "" } }],
  },
  { timestamps: true }
);

projectSchema.index({ title: "text", companyName: "text", skills: "text" });

export const PROJECT_TYPE_VALUES = PROJECT_TYPES;
export const PROJECT_VISIBILITY_VALUES = VISIBILITY_VALUES;
export default mongoose.model("Project", projectSchema);
