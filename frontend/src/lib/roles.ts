import type { RoleCategory, UserRole } from "@/types";

// Category grouping mirrors backend/src/utils/roleCategories.js — a user picks
// one category, then any number of roles within it. Keep these two files in
// sync; this copy is UI-only (menus, onboarding) and never the source of
// truth for what a role is allowed to do — the backend validates that itself.
export const CATEGORY_ROLES: Record<RoleCategory, UserRole[]> = {
  talent: ["freelancer", "job_seeker", "influencer"],
  hiring: ["employer", "client"],
  startup: ["founder", "partner", "investor", "mentor"],
};

export const CATEGORY_LABELS: Record<RoleCategory, string> = {
  talent: "Talent",
  hiring: "Hiring",
  startup: "Startup Ecosystem",
};

export function categoryForRole(role: UserRole): RoleCategory | null {
  for (const category of Object.keys(CATEGORY_ROLES) as RoleCategory[]) {
    if (CATEGORY_ROLES[category].includes(role)) return category;
  }
  return null;
}

// UI-only hint for showing a "verification required" badge next to an
// action — actual enforcement is backend/src/middleware/roleAuth.js.
export const VERIFICATION_REQUIRED_ROLES: UserRole[] = ["employer", "founder", "investor"];

export function dashboardPathForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case "founder":
      return "/dashboard/founder";
    case "freelancer":
      return "/dashboard/freelancer";
    case "job_seeker":
      return "/dashboard/job-seeker";
    case "influencer":
      return "/dashboard/influencer";
    case "employer":
      return "/dashboard/employer";
    case "super_admin":
      return "/dashboard/admin";
    case "investor":
      return "/dashboard/investor";
    case "mentor":
      return "/dashboard/mentor";
    case "partner":
      return "/dashboard/partner";
    case "client":
      return "/dashboard/client";
    case null:
    case undefined:
      return "/dashboard/explore";
    default:
      return "/dashboard/explore";
  }
}

// Where login/Google sign-in lands, as opposed to dashboardPathForRole (used
// for explicit "go to my dashboard" actions elsewhere, e.g. the navbar menu).
// A user who already has a role lands on the homepage — they came back to
// browse, not necessarily to work — and can go to their dashboard from the
// navbar when they want to. A role-less user still gets funneled into
// Explore, since that's the only place they can pick one.
export function postLoginPath(role: UserRole | null | undefined): string {
  return role ? "/" : dashboardPathForRole(role);
}

// Returns where "My Profile" in the navbar should go — only roles with a
// public-facing profile page have one; employer/client/super_admin don't,
// so callers should hide the link entirely when this returns null.
export function publicProfilePathForRole(role: UserRole | null | undefined, userId: string): string | null {
  switch (role) {
    case "founder":
      return `/founders/${userId}`;
    case "freelancer":
      return `/freelancers/${userId}`;
    case "investor":
      return `/investors/${userId}`;
    case "mentor":
      return `/mentors/${userId}`;
    case "partner":
      return `/partners/${userId}`;
    case "job_seeker":
      return `/job-seekers/${userId}`;
    case "influencer":
      return `/influencers/${userId}`;
    default:
      return null;
  }
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  founder: "Startup Founder",
  freelancer: "Freelancer",
  job_seeker: "Job Seeker",
  influencer: "Influencer",
  employer: "Employer",
  investor: "Investor",
  mentor: "Mentor",
  partner: "Partner",
  client: "Client",
};
