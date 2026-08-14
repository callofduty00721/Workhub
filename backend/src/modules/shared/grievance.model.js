import mongoose from "mongoose";

// System of record for the public Contact form (see contact.controller.js) —
// also doubles as the IT Rules 2021 grievance log (see Privacy Policy /
// Terms of Service's "Grievance Officer" section), which requires
// acknowledgement within 24 hours and resolution within 15 days. createdAt/
// acknowledgedAt/resolvedAt are what an admin uses to check whether either
// deadline is at risk — see GRIEVANCE_STATUS_VALUES below.
export const GRIEVANCE_STATUS_VALUES = ["open", "acknowledged", "resolved"];

const grievanceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: GRIEVANCE_STATUS_VALUES, default: "open" },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
    adminNote: { type: String, default: "" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

grievanceSchema.index({ status: 1, createdAt: 1 });

export default mongoose.model("Grievance", grievanceSchema);
