import type { PlanTier } from "@novacrm/db";

export const FREE_PLAN_RECORD_LIMIT = 25;

export function canCreateAdditionalOrg(ownedOrgPlans: string[]): boolean {
  if (ownedOrgPlans.length === 0) return true;
  return ownedOrgPlans.some((plan) => plan !== "FREE");
}

const PLAN_RANK: Record<PlanTier, number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 2,
  BUSINESS: 3,
  ENTERPRISE: 4,
};

export function canAccessPlan(plan: PlanTier, minPlan: PlanTier): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[minPlan];
}
