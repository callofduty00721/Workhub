// Freelancer and influencer share the exact same Earnings/Wallet page
// component, but at two different routes (see frontend's App.tsx) — each
// role's sidebar link only grants access to its own path, so a notification
// sent to the wrong one would 403 instead of opening the wallet.

// campaign/campaign_facilitation are the only Payment types an influencer
// is ever the payee of — every other type implies a freelancer/job_seeker payee.
export function earningsLinkForPaymentType(type) {
  return type === "campaign" || type === "campaign_facilitation" ? "/dashboard/influencer/earnings" : "/dashboard/freelancer/earnings";
}

export function earningsLinkForRole(role) {
  return role === "influencer" ? "/dashboard/influencer/earnings" : "/dashboard/freelancer/earnings";
}
