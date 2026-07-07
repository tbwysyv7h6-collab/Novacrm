import { prisma, type Prisma } from "@novacrm/db";

export async function logAudit(params: {
  organizationId: string;
  userId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId ?? null,
      action: params.action,
      metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
