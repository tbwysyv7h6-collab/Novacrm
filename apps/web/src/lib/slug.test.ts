import { describe, expect, it } from "vitest";
import { slugify, randomSuffix } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Crystal Clear Window Cleaning")).toBe("crystal-clear-window-cleaning");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugify("Joe's Plumbing & Heating!")).toBe("joe-s-plumbing-heating");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Acme Inc--  ")).toBe("acme-inc");
  });

  it("returns an empty string for input with no alphanumerics", () => {
    expect(slugify("***")).toBe("");
  });
});

describe("randomSuffix", () => {
  it("defaults to length 5", () => {
    expect(randomSuffix()).toHaveLength(5);
  });

  it("respects a custom length", () => {
    expect(randomSuffix(8)).toHaveLength(8);
  });

  it("only contains lowercase alphanumeric characters", () => {
    expect(randomSuffix(10)).toMatch(/^[a-z0-9]+$/);
  });
});
