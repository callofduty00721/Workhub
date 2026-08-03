import { describe, it, expect } from "vitest";
import { dashboardPathForRole, ROLE_LABELS, CATEGORY_ROLES, categoryForRole } from "./roles";
import type { UserRole } from "@/types";

const ALL_ROLES: UserRole[] = [
  "super_admin",
  "founder",
  "freelancer",
  "job_seeker",
  "influencer",
  "employer",
  "investor",
  "mentor",
  "partner",
  "client",
];

describe("dashboardPathForRole", () => {
  it("returns a distinct /dashboard path for every role", () => {
    for (const role of ALL_ROLES) {
      expect(dashboardPathForRole(role)).toMatch(/^\/dashboard\//);
    }
  });

  it("maps super_admin to the admin dashboard, not a literal /dashboard/super_admin", () => {
    expect(dashboardPathForRole("super_admin")).toBe("/dashboard/admin");
  });
});

describe("ROLE_LABELS", () => {
  it("has a human-readable label for every role", () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });
});

describe("CATEGORY_ROLES / categoryForRole", () => {
  it("places every non-admin role into exactly one category", () => {
    for (const role of ALL_ROLES) {
      if (role === "super_admin") continue;
      expect(categoryForRole(role)).toBeTruthy();
    }
  });

  it("never mixes roles from different categories under one key", () => {
    expect(CATEGORY_ROLES.talent).toEqual(["freelancer", "job_seeker", "influencer"]);
    expect(CATEGORY_ROLES.hiring).toEqual(["employer", "client"]);
    expect(CATEGORY_ROLES.startup).toEqual(["founder", "partner", "investor", "mentor"]);
  });
});
