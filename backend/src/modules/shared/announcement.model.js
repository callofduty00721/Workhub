import mongoose from "mongoose";
import { ROLE_VALUES } from "./user.model.js";

// Audit record of a broadcast admin action — distinct from Notification,
// which is one row PER RECIPIENT. This is one row per SEND: what was said,
// who it targeted, who sent it, and how many people actually got a
// Notification created for them, so an admin has a real send history
// instead of re-deriving "did I already send this" from thousands of
// Notification rows.
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    // null/undefined = sent to every user (excluding super_admin/staff).
    targetRole: { type: String, enum: ROLE_VALUES, default: null },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientCount: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
