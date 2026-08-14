import PlatformSettings from "../finance/platformSettings.model.js";
import { ROLE_VALUES } from "../shared/user.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { isFirebaseConfigured } from "../../utils/firebaseAuth.js";

const PHONE_AUTH_PROVIDERS = ["disabled", "firebase"];

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
  if (commissionPercent === undefined || commissionPercent < 0 || commissionPercent > 100) {
    throw new ApiError(400, "Commission percent must be between 0 and 100");
  }
  if (phoneAuthProvider !== undefined && !PHONE_AUTH_PROVIDERS.includes(phoneAuthProvider)) {
    throw new ApiError(400, `phoneAuthProvider must be one of: ${PHONE_AUTH_PROVIDERS.join(", ")}`);
  }
  if (allowedEmailDomains !== undefined && !Array.isArray(allowedEmailDomains)) {
    throw new ApiError(400, "allowedEmailDomains must be an array of domains");
  }
  if (jobsEnabled !== undefined && typeof jobsEnabled !== "boolean") {
    throw new ApiError(400, "jobsEnabled must be true or false");
  }
  if (disabledRoles !== undefined) {
    if (!Array.isArray(disabledRoles)) throw new ApiError(400, "disabledRoles must be an array of roles");
    const invalid = disabledRoles.filter((r) => !ROLE_VALUES.includes(r));
    if (invalid.length) throw new ApiError(400, `Unknown role(s): ${invalid.join(", ")}`);
  }

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
