import { z } from "zod";
import { prisma, type Prisma } from "@novacrm/db";
import { router, protectedProcedure } from "../trpc";
import { requireMembership } from "../membership";

async function assertObjectAccess(userId: string, objectId: string) {
  const object = await prisma.crmObject.findUniqueOrThrow({ where: { id: objectId } });
  await requireMembership(userId, object.organizationId, "MEMBER");
  return object;
}

export const viewRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        objectId: z.string(),
        name: z.string().trim().min(1).max(60),
        type: z.enum(["TABLE", "KANBAN", "CALENDAR", "FORM"]),
        config: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertObjectAccess(ctx.userId, input.objectId);
      const count = await prisma.crmView.count({ where: { objectId: input.objectId } });
      return prisma.crmView.create({
        data: {
          objectId: input.objectId,
          name: input.name,
          type: input.type,
          config: (input.config ?? undefined) as Prisma.InputJsonValue | undefined,
          position: count,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        viewId: z.string(),
        name: z.string().trim().min(1).max(60).optional(),
        config: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const view = await prisma.crmView.findUniqueOrThrow({ where: { id: input.viewId } });
      await assertObjectAccess(ctx.userId, view.objectId);
      return prisma.crmView.update({
        where: { id: input.viewId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.config !== undefined && {
            config: input.config as Prisma.InputJsonValue,
          }),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ viewId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const view = await prisma.crmView.findUniqueOrThrow({ where: { id: input.viewId } });
      await assertObjectAccess(ctx.userId, view.objectId);
      await prisma.crmView.delete({ where: { id: input.viewId } });
      return { ok: true };
    }),
});
