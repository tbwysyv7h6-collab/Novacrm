import { describe, expect, it } from "vitest";
import { canCreateAdditionalOrg, canAccessPlan } from "./plan-limits";

describe("canCreateAdditionalOrg", () => {
  it("allows the first CRM for a brand-new user", () => {
    expect(canCreateAdditionalOrg([])).toBe(true);
  });

  it("blocks a second CRM when the user only owns a Free-plan org", () => {
    expect(canCreateAdditionalOrg(["FREE"])).toBe(false);
  });

  it("allows another CRM when the user owns at least one paid org", () => {
    expect(canCreateAdditionalOrg(["FREE", "PRO"])).toBe(true);
    expect(canCreateAdditionalOrg(["BUSINESS"])).toBe(true);
    expect(canCreateAdditionalOrg(["STARTER"])).toBe(true);
  });

  it("blocks when every owned org is on Free", () => {
    expect(canCreateAdditionalOrg(["FREE", "FREE"])).toBe(false);
  });
});

describe("canAccessPlan", () => {
  it("allows a plan exactly at the minimum", () => {
    expect(canAccessPlan("PRO", "PRO")).toBe(true);
  });

  it("allows a plan above the minimum", () => {
    expect(canAccessPlan("BUSINESS", "PRO")).toBe(true);
    expect(canAccessPlan("ENTERPRISE", "PRO")).toBe(true);
  });

  it("blocks a plan below the minimum", () => {
    expect(canAccessPlan("FREE", "PRO")).toBe(false);
    expect(canAccessPlan("STARTER", "PRO")).toBe(false);
  });

  it("treats FREE as the lowest tier", () => {
    expect(canAccessPlan("FREE", "FREE")).toBe(true);
    expect(canAccessPlan("STARTER", "FREE")).toBe(true);
  });
});
