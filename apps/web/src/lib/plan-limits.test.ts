import { describe, expect, it } from "vitest";
import { canCreateAdditionalOrg } from "./plan-limits";

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
