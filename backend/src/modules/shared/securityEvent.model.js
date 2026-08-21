import mongoose from "mongoose";

const SECURITY_EVENT_TYPES = [
  "login_success",
  "login_failed",
  "google_login_success",
  "google_login_failed",
  "register_success",
  "password_reset_requested",
  "password_reset_completed",
  "password_changed",
  "account_deactivated",
  "role_switched",
  "roles_added",
  "category_selected",
];

const securityEventSchema = new mongoose.Schema(
  {
    type: { type: String, enum: SECURITY_EVENT_TYPES, required: true },
    // Not always resolvable to a real account — e.g. login_failed against an
    // email that doesn't exist has no user to attach to. `email` is captured
    // separately for exactly that case (and is what a real forensic review
    // of "who's hammering this address" would filter on).
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String, default: "" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    detail: { type: String, default: "" },
  },
  { timestamps: true }
);

securityEventSchema.index({ type: 1, createdAt: -1 });
securityEventSchema.index({ user: 1, createdAt: -1 });
securityEventSchema.index({ email: 1, createdAt: -1 });

export const SECURITY_EVENT_TYPE_VALUES = SECURITY_EVENT_TYPES;
export default mongoose.model("SecurityEvent", securityEventSchema);
