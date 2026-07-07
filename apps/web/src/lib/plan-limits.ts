export const FREE_PLAN_RECORD_LIMIT = 100;

export function canCreateAdditionalOrg(ownedOrgPlans: string[]): boolean {
  if (ownedOrgPlans.length === 0) return true;
  return ownedOrgPlans.some((plan) => plan !== "FREE");
}
