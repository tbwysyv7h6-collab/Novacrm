import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma, type Prisma } from "@novacrm/db";
import { router, protectedProcedure } from "../trpc";
import { requireMembership } from "../membership";

const actionSchema = z.object({
  type: z.enum(["SEND_EMAIL", "CREATE_TASK", "UPDATE_FIELD", "ASSIGN_USER", "SEND_REMINDER"]),
  config: z.record(z.string(), z.unknown()),
});

const conditionSchema = z.object({
  fieldApiName: z.string(),
  operator: z.enum(["equals", "not_equals", "changed"]),
  value: z.unknown().optional(),
});

async function assertObjectAccess(userId: string, objectId: string) {
  const object = await prisma.crmObject.findUniqueOrThrow({ where: { id: objectId } });
  await requireMembership(userId, object.organizationId, "MEMBER");
  return object;
}

export const automationRouter = router({
  list: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId);
      return prisma.crmAutomation.findMany({
        where: { organizationId: input.organizationId },
        include: { object: { select: { id: true, name: true, icon: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        objectId: z.string(),
        name: z.string().trim().min(1).max(80),
        trigger: z.enum(["RECORD_CREATED", "RECORD_UPDATED"]),
        conditions: z.array(conditionSchema).optional(),
        actions: z.array(actionSchema).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const object = await assertObjectAccess(ctx.userId, input.objectId);

      const organization = await prisma.organization.findUniqueOrThrow({
        where: { id: object.organizationId },
        select: { plan: true },
      });
      if (organization.plan === "FREE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Automations require the Starter plan or above. Upgrade to start automating.",
        });
      }

      return prisma.crmAutomation.create({
        data: {
          organizationId: object.organizationId,
          objectId: input.objectId,
          name: input.name,
          trigger: input.trigger,
          conditions: (input.conditions ?? undefined) as Prisma.InputJsonValue | undefined,
          actions: input.actions as Prisma.InputJsonValue,
        },
      });
    }),

  toggle: protectedProcedure
    .input(z.object({ automationId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const automation = await prisma.crmAutomation.findUniqueOrThrow({
        where: { id: input.automationId },
      });
      await requireMembership(ctx.userId, automation.organizationId, "MEMBER");
      return prisma.crmAutomation.update({
        where: { id: input.automationId },
        data: { isActive: input.isActive },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ automationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const automation = await prisma.crmAutomation.findUniqueOrThrow({
        where: { id: input.automationId },
      });
      await requireMembership(ctx.userId, automation.organizationId, "ADMIN");
      await prisma.crmAutomation.delete({ where: { id: input.automationId } });
      return { ok: true };
    }),
});
