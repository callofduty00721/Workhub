import type { RoleCategory, UserRole } from "@/types";

// Category grouping mirrors backend/src/utils/roleCategories.js — a user picks
// one category, then any number of roles within it. Keep these two files in
// sync; this copy is UI-only (menus, onboarding) and never the source of
// truth for what a role is allowed to do — the backend validates that itself.
// "job_seeker" and "employer" are commented out of their category lists
// while the Jobs feature (App.tsx's /jobs routes) is disabled — both roles
// exist only to browse/post to that board, so offering them at
// signup/role-add would let someone pick a role with nothing to do. This is
// UI-only: existing job_seeker/employer accounts are untouched and keep
// full dashboard access, this just stops new selections. Re-enable by
// un-commenting alongside re-enabling the /jobs routes.
// brand/agency/talent_partner hire influencers via the Campaign flow only
// (see EmployerDashboard's campaign routes) — unaffected by the Jobs-board
// disable above, so they stay offered at signup regardless.
export const CATEGORY_ROLES: Record<RoleCategory, UserRole[]> = {
  talent: ["freelancer", /* "job_seeker", */ "influencer"],
  hiring: [/* "employer", */ "client", "brand", "agency", "talent_partner"],
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
export const VERIFICATION_REQUIRED_ROLES: UserRole[] = ["employer", "client", "brand", "agency", "talent_partner", "founder", "investor"];

// Roles that can post/manage Campaigns — the only ones who'd ever invite or
// shortlist an influencer. Mirrors campaign.routes.js's invite-route
// authorize() list; used by both InviteToCampaignDialog's trigger and
// SaveButton's "influencer" type gating.
export const CAMPAIGN_HIRER_ROLES: UserRole[] = ["employer", "client", "brand", "agency", "talent_partner"];

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
    case "staff":
      return "/dashboard/admin";
    case "investor":
      return "/dashboard/investor";
    case "mentor":
      return "/dashboard/mentor";
    case "partner":
      return "/dashboard/partner";
    case "client":
      return "/dashboard/client";
    // These three only ever hire influencers via Campaigns (no Jobs/Projects
    // of their own) — their "home" is the campaigns list, not the Jobs-
    // focused main employer dashboard.
    case "brand":
    case "agency":
    case "talent_partner":
      return "/dashboard/employer/campaigns";
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
    case "brand":
      return `/brands/${userId}`;
    case "agency":
      return `/agencies/${userId}`;
    case "talent_partner":
      return `/talent-partners/${userId}`;
    default:
      return null;
  }
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  staff: "Staff",
  founder: "Startup Founder",
  freelancer: "Freelancer",
  job_seeker: "Job Seeker",
  influencer: "Influencer",
  employer: "Employer",
  investor: "Investor",
  mentor: "Mentor",
  partner: "Partner",
  client: "Client",
  brand: "Brand",
  agency: "Agency",
  talent_partner: "Talent Partner",
};

// One-line explanation shown next to each role's name at signup/role-add —
// a bare label like "Freelancer" doesn't say what picking it actually lets
// someone do, unlike the category cards above it which already had a desc.
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: "Full platform administration",
  staff: "Scoped admin access assigned by a Super Admin",
  founder: "List your startup and raise funding or build a team",
  freelancer: "Offer paid gigs/services and get hired for freelance work",
  job_seeker: "Browse and apply to full-time job openings",
  influencer: "Get discovered and hired by brands for paid campaigns",
  employer: "Post full-time jobs and hire employees",
  investor: "Discover startups and track your investments",
  mentor: "Offer paid or free mentorship sessions to founders",
  partner: "List your agency or business and connect with founders looking to collaborate",
  client: "Post projects and hire freelancers to complete them",
  brand: "Hire influencers to run marketing campaigns for your company",
  agency: "Run influencer campaigns on behalf of brand clients you manage",
  talent_partner: "Represent a roster of influencers and land deals for them",
};
