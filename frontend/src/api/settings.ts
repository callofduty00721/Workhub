import { api } from "./axios";
import type { PhoneAuthProvider } from "@/types";

// Public (non-admin) read of which phone-verification provider is active —
// any logged-in user needs this to know which UI to render. See
// backend/src/modules/shared/publicSettings.routes.js.
export const publicSettingsApi = {
  phoneAuthProvider: () =>
    api.get<{ success: boolean; data: { provider: PhoneAuthProvider } }>("/settings/phone-auth-provider").then((r) => r.data.data.provider),

  // Public read of the Jobs board kill-switch — drives whether the "Jobs"
  // nav link and /jobs, /jobs/:id routes render for everyone, logged in or not.
  jobsEnabled: () =>
    api.get<{ success: boolean; data: { enabled: boolean } }>("/settings/jobs-enabled").then((r) => r.data.data.enabled),

  // Which payment gateways actually have server-side keys configured — the
  // Pricing page uses this to hide a "Pay with X" button entirely rather
  // than showing one that just 503s on click.
  paymentGateways: () =>
    api
      .get<{ success: boolean; data: { razorpay: boolean; stripe: boolean } }>("/settings/payment-gateways")
      .then((r) => r.data.data),

  // Public read of the platform commission rate — used to show the exact
  // off-platform facilitation fee before the brand confirms it.
  commissionPercent: () =>
    api.get<{ success: boolean; data: { commissionPercent: number } }>("/settings/commission-percent").then((r) => r.data.data.commissionPercent),
};
