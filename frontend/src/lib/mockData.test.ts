import { describe, it, expect } from "vitest";
import { CATEGORIES, SERVICE_CATEGORIES, SERVICE_CATEGORY_NAMES, INDUSTRY_SUBCATEGORIES, INDUSTRIES } from "./mockData";

describe("CATEGORIES", () => {
  it("is a non-empty flat list of category names", () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
    for (const c of CATEGORIES) expect(typeof c).toBe("string");
  });
});

describe("SERVICE_CATEGORIES (Fiverr-style gig taxonomy)", () => {
  it("gives every top-level category at least one sub-category", () => {
    for (const [category, subs] of Object.entries(SERVICE_CATEGORIES)) {
      expect(Array.isArray(subs)).toBe(true);
      expect(subs.length, `${category} should have sub-categories`).toBeGreaterThan(0);
    }
  });

  it("keeps SERVICE_CATEGORY_NAMES in sync with SERVICE_CATEGORIES' keys", () => {
    expect(SERVICE_CATEGORY_NAMES).toEqual(Object.keys(SERVICE_CATEGORIES));
  });

  it("has no duplicate top-level category names", () => {
    expect(new Set(SERVICE_CATEGORY_NAMES).size).toBe(SERVICE_CATEGORY_NAMES.length);
  });
});

describe("INDUSTRY_SUBCATEGORIES (startup taxonomy)", () => {
  it("gives every industry at least one sub-category", () => {
    for (const [industry, subs] of Object.entries(INDUSTRY_SUBCATEGORIES)) {
      expect(subs.length, `${industry} should have sub-categories`).toBeGreaterThan(0);
    }
  });

  it("keeps INDUSTRIES in sync with INDUSTRY_SUBCATEGORIES' keys", () => {
    expect(INDUSTRIES).toEqual(Object.keys(INDUSTRY_SUBCATEGORIES));
  });

  it("is a separate taxonomy from the freelancer SERVICE_CATEGORIES list", () => {
    expect(INDUSTRIES).not.toEqual(SERVICE_CATEGORY_NAMES);
  });
});
