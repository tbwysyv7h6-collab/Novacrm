import { prisma, type CrmObject } from "@novacrm/db";
import { FREE_PLAN_RECORD_LIMIT } from "@/lib/plan-limits";

export async function checkRecordQuota(
  object: Pick<CrmObject, "id" | "organizationId">,
): Promise<{ allowed: boolean; message?: string }> {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: object.organizationId },
    select: { plan: true },
  });
  if (organization.plan !== "FREE") return { allowed: true };

  const count = await prisma.crmRecord.count({ where: { objectId: object.id } });
  if (count >= FREE_PLAN_RECORD_LIMIT) {
    return {
      allowed: false,
      message: `The Free plan is limited to ${FREE_PLAN_RECORD_LIMIT} records per object. Upgrade to Starter for unlimited records.`,
    };
  }
  return { allowed: true };
}
