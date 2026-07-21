import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatFundingCompact, formatCompactNumber, initialsFromName } from "./utils";

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});

describe("formatCurrency", () => {
  it("formats INR with no decimal places", () => {
    expect(formatCurrency(2500)).toBe("₹2,500");
  });

  it("formats USD when specified", () => {
    expect(formatCurrency(100, "USD")).toContain("100");
  });
});

describe("formatFundingCompact", () => {
  it("formats crore-scale amounts as Cr", () => {
    expect(formatFundingCompact(25000000)).toBe("₹2.5 Cr");
  });

  it("formats lakh-scale amounts as L", () => {
    expect(formatFundingCompact(750000)).toBe("₹7.5 L");
  });

  it("falls back to plain currency below a lakh", () => {
    expect(formatFundingCompact(8000)).toBe(formatCurrency(8000));
  });
});

describe("formatCompactNumber", () => {
  it("compacts large numbers", () => {
    expect(formatCompactNumber(12000)).toBe("12K");
  });

  it("leaves small numbers as-is", () => {
    expect(formatCompactNumber(42)).toBe("42");
  });
});

describe("initialsFromName", () => {
  it("takes the first letter of the first two words", () => {
    expect(initialsFromName("Aditi Kulkarni")).toBe("AK");
  });

  it("uppercases a single-word name", () => {
    expect(initialsFromName("mahahub")).toBe("M");
  });

  it("ignores words beyond the first two", () => {
    expect(initialsFromName("Rohan Kumar Sharma")).toBe("RK");
  });
});
