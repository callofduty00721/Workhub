import mongoose from "mongoose";

const NOTIFICATION_TYPES = [
  "startup_follow",
  "startup_interest",
  "startup_pitch",
  "job_application",
  "application_status",
  "new_message",
  "session_request",
  "session_status",
  "review_received",
  "roster_invite",
  "roster_invite_status",
  "campaign_invite",
  "system",
  "announcement",
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    link: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export const NOTIFICATION_TYPE_VALUES = NOTIFICATION_TYPES;
export default mongoose.model("Notification", notificationSchema);
