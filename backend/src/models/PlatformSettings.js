import mongoose from "mongoose";

// Singleton document — there is always exactly one PlatformSettings row.
const platformSettingsSchema = new mongoose.Schema(
  {
    commissionPercent: { type: Number, default: 10, min: 0, max: 100 },
  },
  { timestamps: true }
);

const PlatformSettings = mongoose.model("PlatformSettings", platformSettingsSchema);

export async function getCommissionPercent() {
  const settings = await PlatformSettings.findOne();
  return settings?.commissionPercent ?? 10;
}

export default PlatformSettings;
