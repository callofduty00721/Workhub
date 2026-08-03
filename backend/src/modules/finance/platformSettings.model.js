import mongoose from "mongoose";

// Singleton document — there is always exactly one PlatformSettings row.
const platformSettingsSchema = new mongoose.Schema(
  {
    commissionPercent: { type: Number, default: 10, min: 0, max: 100 },
    // Which provider verifies a user's phone number. "disabled" turns the
    // whole phone-verification feature off (no gate at all) — an admin
    // escape hatch for whenever neither provider is configured/working.
    phoneAuthProvider: { type: String, enum: ["disabled", "firebase", "twilio"], default: "disabled" },
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

export default PlatformSettings;
