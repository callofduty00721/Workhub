import { describe, it, expect } from "vitest";
import {
  CATEGORIES,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_NAMES,
  SERVICE_SUBCATEGORIES,
  INDUSTRY_SUBCATEGORIES,
  INDUSTRIES,
} from "./mockData";

describe("CATEGORIES", () => {
  it("is a non-empty flat list of category names", () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
    for (const c of CATEGORIES) expect(typeof c).toBe("string");
  });
});

describe("SERVICE_CATEGORIES (3-level Category -> Section -> skill taxonomy)", () => {
  it("gives every top-level category at least one section, each with at least one skill", () => {
    for (const [category, sections] of Object.entries(SERVICE_CATEGORIES)) {
      const sectionEntries = Object.entries(sections);
      expect(sectionEntries.length, `${category} should have sections`).toBeGreaterThan(0);
      for (const [section, skills] of sectionEntries) {
        expect(Array.isArray(skills)).toBe(true);
        expect(skills.length, `${category} -> ${section} should have skills`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps SERVICE_CATEGORY_NAMES in sync with SERVICE_CATEGORIES' keys", () => {
    expect(SERVICE_CATEGORY_NAMES).toEqual(Object.keys(SERVICE_CATEGORIES));
  });

  it("has no duplicate top-level category names", () => {
    expect(new Set(SERVICE_CATEGORY_NAMES).size).toBe(SERVICE_CATEGORY_NAMES.length);
  });
});

describe("SERVICE_SUBCATEGORIES (flattened view of SERVICE_CATEGORIES)", () => {
  it("flattens every category's sections into one skill list", () => {
    for (const [category, sections] of Object.entries(SERVICE_CATEGORIES)) {
      const flattened = Object.values(sections).flat();
      expect(SERVICE_SUBCATEGORIES[category]).toEqual(flattened);
    }
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
