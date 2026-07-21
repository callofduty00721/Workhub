import mongoose from "mongoose";

const JOB_TYPES = ["full_time", "part_time", "contract", "internship", "freelance"];
const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "lead"];

const jobSchema = new mongoose.Schema(
  {
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", companyName: "text", skills: "text" });

export const JOB_TYPE_VALUES = JOB_TYPES;
export const EXPERIENCE_LEVEL_VALUES = EXPERIENCE_LEVELS;
export default mongoose.model("Job", jobSchema);
