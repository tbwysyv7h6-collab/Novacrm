import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma, type Prisma } from "@novacrm/db";
import { router, protectedProcedure } from "../trpc";
import { requireMembership } from "../membership";
import { runAutomations } from "../automations/run";
import { checkRecordQuota } from "../record-quota";
import { dispatchWebhooks } from "../webhooks/dispatch";

async function assertObjectAccess(userId: string, objectId: string, minRole: "MEMBER" | "ADMIN" = "MEMBER") {
  const object = await prisma.crmObject.findUniqueOrThrow({ where: { id: objectId } });
  await requireMembership(userId, object.organizationId, minRole);
  return object;
}

export const recordRouter = router({
  list: protectedProcedure
    .input(z.object({ objectId: z.string(), take: z.number().min(1).max(500).default(200) }))
    .query(async ({ ctx, input }) => {
      await assertObjectAccess(ctx.userId, input.objectId, "MEMBER");
      return prisma.crmRecord.findMany({
        where: { objectId: input.objectId },
        orderBy: { createdAt: "desc" },
        take: input.take,
      });
    }),

  create: protectedProcedure
    .input(z.object({ objectId: z.string(), data: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      const object = await assertObjectAccess(ctx.userId, input.objectId, "MEMBER");
      const quota = await checkRecordQuota(object);
      if (!quota.allowed) {
        throw new TRPCError({ code: "FORBIDDEN", message: quota.message });
      }
      const record = await prisma.crmRecord.create({
        data: {
          objectId: input.objectId,
          organizationId: object.organizationId,
          data: input.data as Prisma.InputJsonValue,
          createdById: ctx.userId,
          updatedById: ctx.userId,
        },
      });
      await runAutomations({ event: "RECORD_CREATED", record, object });
      await dispatchWebhooks(object.organizationId, "record.created", record);
      return record;
    }),

  update: protectedProcedure
    .input(z.object({ recordId: z.string(), data: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.crmRecord.findUniqueOrThrow({ where: { id: input.recordId } });
      const object = await assertObjectAccess(ctx.userId, existing.objectId, "MEMBER");
      const record = await prisma.crmRecord.update({
        where: { id: input.recordId },
        data: {
          data: { ...(existing.data as object), ...input.data } as Prisma.InputJsonValue,
          updatedById: ctx.userId,
        },
      });
      await runAutomations({ event: "RECORD_UPDATED", record, object, previous: existing });
      await dispatchWebhooks(object.organizationId, "record.updated", record);
      return record;
    }),

  delete: protectedProcedure
    .input(z.object({ recordId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.crmRecord.findUniqueOrThrow({ where: { id: input.recordId } });
      await assertObjectAccess(ctx.userId, existing.objectId, "MEMBER");
      await prisma.crmRecord.delete({ where: { id: input.recordId } });
      return { ok: true };
    }),
});
