import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@novacrm/db";
import { router, protectedProcedure } from "../trpc";
import { requireMembership } from "../membership";
import { slugify } from "@/lib/slug";
import { logAudit } from "../audit";

async function uniqueApiName(organizationId: string, base: string): Promise<string> {
  const root = slugify(base) || "object";
  let apiName = root;
  let i = 1;
  while (
    await prisma.crmObject.findUnique({ where: { organizationId_apiName: { organizationId, apiName } } })
  ) {
    i += 1;
    apiName = `${root}-${i}`;
  }
  return apiName;
}

export const objectRouter = router({
  list: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId);
      return prisma.crmObject.findMany({
        where: { organizationId: input.organizationId },
        orderBy: { position: "asc" },
      });
    }),

  get: protectedProcedure
    .input(z.object({ objectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const object = await prisma.crmObject.findUniqueOrThrow({
        where: { id: input.objectId },
        include: { fields: { orderBy: { position: "asc" } }, views: { orderBy: { position: "asc" } } },
      });
      await requireMembership(ctx.userId, object.organizationId);
      return object;
    }),

  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().trim().min(1).max(60),
        icon: z.string().max(10).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "MEMBER");
      const apiName = await uniqueApiName(input.organizationId, input.name);
      const count = await prisma.crmObject.count({ where: { organizationId: input.organizationId } });

      return prisma.$transaction(async (tx) => {
        const object = await tx.crmObject.create({
          data: {
            organizationId: input.organizationId,
            name: input.name,
            apiName,
            icon: input.icon,
            position: count,
          },
        });
        await tx.crmField.create({
          data: {
            objectId: object.id,
            name: "Name",
            apiName: "name",
            type: "TEXT",
            isRequired: true,
            position: 0,
          },
        });
        await tx.crmView.create({
          data: { objectId: object.id, name: "All records", type: "TABLE", position: 0 },
        });
        return object;
      });
    }),

  rename: protectedProcedure
    .input(z.object({ objectId: z.string(), name: z.string().trim().min(1).max(60) }))
    .mutation(async ({ ctx, input }) => {
      const object = await prisma.crmObject.findUniqueOrThrow({ where: { id: input.objectId } });
      await requireMembership(ctx.userId, object.organizationId, "MEMBER");
      return prisma.crmObject.update({ where: { id: input.objectId }, data: { name: input.name } });
    }),

  reorder: protectedProcedure
    .input(z.object({ organizationId: z.string(), objectIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "MEMBER");
      await prisma.$transaction(
        input.objectIds.map((id, position) =>
          prisma.crmObject.update({ where: { id }, data: { position } }),
        ),
      );
      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ objectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const object = await prisma.crmObject.findUniqueOrThrow({ where: { id: input.objectId } });
      await requireMembership(ctx.userId, object.organizationId, "ADMIN");
      if (object.isSystem) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This object can't be deleted." });
      }
      await prisma.crmObject.delete({ where: { id: input.objectId } });
      await logAudit({
        organizationId: object.organizationId,
        userId: ctx.userId,
        action: "object.deleted",
        metadata: { objectId: object.id, name: object.name },
      });
      return { ok: true };
    }),
});
