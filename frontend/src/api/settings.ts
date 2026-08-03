import { api } from "./axios";
import type { PhoneAuthProvider } from "@/types";

// Public (non-admin) read of which phone-verification provider is active —
// any logged-in user needs this to know which UI to render. See
// backend/src/modules/shared/publicSettings.routes.js.
export const publicSettingsApi = {
  phoneAuthProvider: () =>
    api.get<{ success: boolean; data: { provider: PhoneAuthProvider } }>("/settings/phone-auth-provider").then((r) => r.data.data.provider),
};
