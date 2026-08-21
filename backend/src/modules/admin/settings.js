import PlatformSettings from "../finance/platformSettings.model.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { isFirebaseConfigured } from "../../utils/firebaseAuth.js";

// Whether each provider's server-side credentials are actually present —
// computed from env vars, not stored in the DB, so the admin UI can warn
// before someone picks a provider that isn't configured yet.
function providerConfigStatus() {
  return { firebaseConfigured: isFirebaseConfigured() };
}

export const getPlatformSettings = asyncHandler(async (req, res) => {
  let settings = await PlatformSettings.findOne();
  if (!settings) settings = await PlatformSettings.create({});
  res.json({ success: true, data: { ...settings.toObject(), ...providerConfigStatus() } });
});

export const updatePlatformSettings = asyncHandler(async (req, res) => {
  const { commissionPercent, phoneAuthProvider, allowedEmailDomains, jobsEnabled, disabledRoles } = req.body;

  let settings = await PlatformSettings.findOne();
  if (!settings) settings = new PlatformSettings();
  settings.commissionPercent = commissionPercent;
  if (phoneAuthProvider !== undefined) settings.phoneAuthProvider = phoneAuthProvider;
  if (allowedEmailDomains !== undefined) {
    // Dedupe + normalize — the register() check compares against exactly
    // this lowercase/trimmed form.
    settings.allowedEmailDomains = [...new Set(allowedEmailDomains.map((d) => String(d).toLowerCase().trim()).filter(Boolean))];
  }
  if (jobsEnabled !== undefined) settings.jobsEnabled = jobsEnabled;
  if (disabledRoles !== undefined) settings.disabledRoles = [...new Set(disabledRoles)];
  await settings.save();

  res.json({ success: true, data: { ...settings.toObject(), ...providerConfigStatus() } });
});
