// Category grouping for the multi-role system. A user picks exactly one
// category, then any number of roles within it (see User.roles/selectedCategory).
// super_admin and legacy "founder" solo-role users are intentionally outside
// this grouping — super_admin is never self-assigned, and "founder" is kept as
// the underlying role value for what the product now calls "Startup founder".
export const CATEGORIES = ["talent", "hiring", "startup"];

export const CATEGORY_ROLES = {
  talent: ["freelancer", "job_seeker", "influencer"],
  hiring: ["employer", "client"],
  startup: ["founder", "partner", "investor", "mentor"],
};

export function categoryForRole(role) {
  for (const [category, roles] of Object.entries(CATEGORY_ROLES)) {
    if (roles.includes(role)) return category;
  }
  return null;
}

// Which (role -> action) combinations are "high-risk" and require
// isVerified === true before the corresponding controller lets the request
// through. Roles/actions not listed here are never gated — this is a
// deliberate allowlist, not a denylist, so adding a new low-risk role or
// action never accidentally requires verification.
export const ACTION_VERIFICATION_MAP = {
  employer: ["post_job", "post_campaign"],
  founder: ["post_paid_job", "pitch_investor"],
  investor: ["contact_startup"],
};

export function actionRequiresVerification(role, action) {
  return Boolean(ACTION_VERIFICATION_MAP[role]?.includes(action));
}

// Roles that ever appear as a key in ACTION_VERIFICATION_MAP — used by the
// frontend to decide whether to show the "get verified" banner/CTA at all,
// independent of which specific action is gated.
export const SENSITIVE_ROLES = Object.keys(ACTION_VERIFICATION_MAP);
