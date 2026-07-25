import type { UserRole } from "@/types";

export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "founder":
      return "/dashboard/founder";
    case "freelancer":
      return "/dashboard/freelancer";
    case "employer":
      return "/dashboard/employer";
    case "super_admin":
      return "/dashboard/admin";
    case "investor":
      return "/dashboard/investor";
    case "mentor":
      return "/dashboard/mentor";
    case "partner":
      return "/dashboard/profile";
    case "client":
      return "/dashboard/client";
    default:
      return "/dashboard/founder";
  }
}

// Returns where "My Profile" in the navbar should go — only roles with a
// public-facing profile page have one; employer/client/super_admin don't,
// so callers should hide the link entirely when this returns null.
export function publicProfilePathForRole(role: UserRole, userId: string): string | null {
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
    default:
      return null;
  }
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  founder: "Founder",
  freelancer: "Freelancer",
  employer: "Employer",
  investor: "Investor",
  mentor: "Mentor",
  partner: "Partner",
  client: "Client",
};
