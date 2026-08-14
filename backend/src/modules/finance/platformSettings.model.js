import mongoose from "mongoose";
import { ROLE_VALUES } from "../shared/user.model.js";

// Singleton document — there is always exactly one PlatformSettings row.
const platformSettingsSchema = new mongoose.Schema(
  {
    commissionPercent: { type: Number, default: 10, min: 0, max: 100 },
    // Which provider verifies a user's phone number. "disabled" turns the
    // whole phone-verification feature off (no gate at all) — an admin
    // escape hatch for whenever neither provider is configured/working.
    phoneAuthProvider: { type: String, enum: ["disabled", "firebase"], default: "disabled" },
    // Manual override for the disposable-email blocklist (utils/disposableEmail.js)
    // — no third-party list is ever complete or free of false positives, so a
    // real business domain that gets wrongly flagged can be added here by an
    // admin without a code change/deploy.
    allowedEmailDomains: [{ type: String, lowercase: true, trim: true }],
    // Runtime kill-switch for the whole Jobs board (browse/details + the
    // "Jobs" nav link) — lets an admin turn it back on without a deploy.
    // Starts false to match the current disabled state; see
    // getJobsEnabled()/AdminSettings.tsx's "Jobs Feature" toggle.
    jobsEnabled: { type: Boolean, default: false },
    // Roles nobody can newly pick — at signup (auth.controller.js's register())
    // or via the multi-role add flow (role.controller.js's addRoles()) — while
    // listed here. Existing holders are untouched and keep using the role as
    // normal; this only closes the door on new signups/additions. An admin
    // lifts it anytime via PUT /api/admin/settings, no deploy needed.
    disabledRoles: [{ type: String, enum: ROLE_VALUES }],
  },
  { timestamps: true }
);

const PlatformSettings = mongoose.model("PlatformSettings", platformSettingsSchema);

export async function getCommissionPercent() {
  const settings = await PlatformSettings.findOne();
  return settings?.commissionPercent ?? 10;
}

export async function getPhoneAuthProvider() {
  const settings = await PlatformSettings.findOne();
  return settings?.phoneAuthProvider ?? "disabled";
}

export async function isEmailDomainAllowlisted(domain) {
  const settings = await PlatformSettings.findOne();
  return Boolean(settings?.allowedEmailDomains?.includes(domain));
}

export async function getJobsEnabled() {
  const settings = await PlatformSettings.findOne();
  return settings?.jobsEnabled ?? false;
}

export async function getDisabledRoles() {
  const settings = await PlatformSettings.findOne();
  return settings?.disabledRoles ?? [];
}

export default PlatformSettings;
