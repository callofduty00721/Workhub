import mongoose from "mongoose";

// "freelance" intentionally excluded — that's Project.js territory now (bid-based work).
const JOB_TYPES = ["full_time", "part_time", "contract", "internship"];
const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "lead"];
const VISIBILITY_VALUES = ["public", "invite_only"];

const jobSchema = new mongoose.Schema(
  {
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Snapshotted from employer.company at creation time — lets any teammate in
    // the same company manage this job, not just the person who posted it.
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    title: { type: String, required: true, trim: true },
    companyName: { type: String, required: true },
    description: { type: String, required: true },
    responsibilities: { type: String, default: "" },
    requirements: { type: String, default: "" },
    type: { type: String, enum: JOB_TYPES, default: "full_time" },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, default: "entry" },
    skills: [{ type: String }],
    location: { type: String, required: true },
    isRemote: { type: Boolean, default: false },
    salaryMin: { type: Number, default: 0 },
    salaryMax: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["open", "closed", "draft"], default: "open" },
    applicationsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },

    // Private/NDA project support — "invite_only" jobs are hidden from public
    // listing/search and only visible to the employer, admins, and the
    // freelancers explicitly invited below.
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
    // Attachments are stored by R2 object key, never a public URL — access is
    // only ever granted through a short-lived signed URL after the viewer
    // passes the visibility + NDA checks (see jobController.getAttachmentUrl).
    attachments: [{ key: { type: String, required: true }, name: { type: String, default: "" } }],
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", companyName: "text", skills: "text" });

export const JOB_TYPE_VALUES = JOB_TYPES;
export const EXPERIENCE_LEVEL_VALUES = EXPERIENCE_LEVELS;
export const VISIBILITY_VALUES_EXPORT = VISIBILITY_VALUES;
export default mongoose.model("Job", jobSchema);
