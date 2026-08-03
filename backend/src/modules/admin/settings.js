import PlatformSettings from "../finance/platformSettings.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { isFirebaseConfigured } from "../../utils/firebaseAuth.js";
import { isTwilioConfigured } from "../../utils/twilioVerify.js";

const PHONE_AUTH_PROVIDERS = ["disabled", "firebase", "twilio"];

// Whether each provider's server-side credentials are actually present —
// computed from env vars, not stored in the DB, so the admin UI can warn
// before someone picks a provider that isn't configured yet.
function providerConfigStatus() {
  return { firebaseConfigured: isFirebaseConfigured(), twilioConfigured: isTwilioConfigured() };
}

export const getPlatformSettings = asyncHandler(async (req, res) => {
  let settings = await PlatformSettings.findOne();
  if (!settings) settings = await PlatformSettings.create({});
  res.json({ success: true, data: { ...settings.toObject(), ...providerConfigStatus() } });
});

export const updatePlatformSettings = asyncHandler(async (req, res) => {
  const { commissionPercent, phoneAuthProvider } = req.body;
  if (commissionPercent === undefined || commissionPercent < 0 || commissionPercent > 100) {
    throw new ApiError(400, "Commission percent must be between 0 and 100");
  }
  if (phoneAuthProvider !== undefined && !PHONE_AUTH_PROVIDERS.includes(phoneAuthProvider)) {
    throw new ApiError(400, `phoneAuthProvider must be one of: ${PHONE_AUTH_PROVIDERS.join(", ")}`);
  }

  let settings = await PlatformSettings.findOne();
  if (!settings) settings = new PlatformSettings();
  settings.commissionPercent = commissionPercent;
  if (phoneAuthProvider !== undefined) settings.phoneAuthProvider = phoneAuthProvider;
  await settings.save();

  res.json({ success: true, data: { ...settings.toObject(), ...providerConfigStatus() } });
});
