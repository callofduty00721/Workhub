import { describe, it, expect } from "vitest";
import { dashboardPathForRole, ROLE_LABELS } from "./roles";
import type { UserRole } from "@/types";

const ALL_ROLES: UserRole[] = ["super_admin", "founder", "freelancer", "employer", "investor", "mentor", "partner", "client"];

describe("dashboardPathForRole", () => {
  it("returns a distinct /dashboard path for every role", () => {
    for (const role of ALL_ROLES) {
      expect(dashboardPathForRole(role)).toMatch(/^\/dashboard\//);
    }
  });

  it("maps super_admin to the admin dashboard, not a literal /dashboard/super_admin", () => {
    expect(dashboardPathForRole("super_admin")).toBe("/dashboard/admin");
  });

  it("never routes to the removed job_seeker dashboard", () => {
    for (const role of ALL_ROLES) {
      expect(dashboardPathForRole(role)).not.toContain("jobseeker");
    }
  });
});

describe("ROLE_LABELS", () => {
  it("has a human-readable label for every role", () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });

  it("does not carry a stale label for the removed job_seeker role", () => {
    expect(Object.keys(ROLE_LABELS)).not.toContain("job_seeker");
  });
});
