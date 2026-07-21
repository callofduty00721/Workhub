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
