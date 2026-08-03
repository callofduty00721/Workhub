import mongoose from "mongoose";

// A manually-logged work-diary entry against a hired application — this app
// has no desktop agent to capture screenshots/activity levels the way Upwork
// does, so hourly trust here is built on the freelancer's own log plus the
// client being able to see and dispute it before paying, not passive monitoring.
const timeEntrySchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    hours: { type: Number, required: true, min: 0.25, max: 24 },
    description: { type: String, default: "" },
    billed: { type: Boolean, default: false },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  },
  { timestamps: true }
);

timeEntrySchema.index({ application: 1, billed: 1 });

export default mongoose.model("TimeEntry", timeEntrySchema);
