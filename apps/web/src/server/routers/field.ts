import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma, type Prisma } from "@novacrm/db";
import { router, protectedProcedure } from "../trpc";
import { requireMembership } from "../membership";
import { slugify } from "@/lib/slug";
import { logAudit } from "../audit";

const fieldTypeSchema = z.enum([
  "TEXT",
  "LONG_TEXT",
  "NUMBER",
  "CURRENCY",
  "BOOLEAN",
  "DATE",
  "DATETIME",
  "EMAIL",
  "PHONE",
  "URL",
  "SELECT",
  "MULTI_SELECT",
  "USER_REF",
  "RELATION",
  "ATTACHMENT",
  "FORMULA",
  "AUTO_NUMBER",
]);

async function uniqueFieldApiName(objectId: string, base: string): Promise<string> {
  const root = slugify(base) || "field";
  let apiName = root;
  let i = 1;
  while (await prisma.crmField.findUnique({ where: { objectId_apiName: { objectId, apiName } } })) {
    i += 1;
    apiName = `${root}-${i}`;
  }
  return apiName;
}

async function assertObjectAccess(userId: string, objectId: string, minRole: "MEMBER" | "ADMIN" = "MEMBER") {
  const object = await prisma.crmObject.findUniqueOrThrow({ where: { id: objectId } });
  await requireMembership(userId, object.organizationId, minRole);
  return object;
}

export const fieldRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        objectId: z.string(),
        name: z.string().trim().min(1).max(60),
        type: fieldTypeSchema,
        isRequired: z.boolean().optional(),
        options: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertObjectAccess(ctx.userId, input.objectId);
      const apiName = await uniqueFieldApiName(input.objectId, input.name);
      const count = await prisma.crmField.count({ where: { objectId: input.objectId } });

      return prisma.crmField.create({
        data: {
          objectId: input.objectId,
          name: input.name,
          apiName,
          type: input.type,
          isRequired: input.isRequired ?? false,
          options: (input.options ?? undefined) as Prisma.InputJsonValue | undefined,
          position: count,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        fieldId: z.string(),
        name: z.string().trim().min(1).max(60).optional(),
        isRequired: z.boolean().optional(),
        options: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const field = await prisma.crmField.findUniqueOrThrow({ where: { id: input.fieldId } });
      await assertObjectAccess(ctx.userId, field.objectId);
      return prisma.crmField.update({
        where: { id: input.fieldId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.isRequired !== undefined && { isRequired: input.isRequired }),
          ...(input.options !== undefined && {
            options: input.options as Prisma.InputJsonValue,
          }),
        },
      });
    }),

  reorder: protectedProcedure
    .input(z.object({ objectId: z.string(), fieldIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await assertObjectAccess(ctx.userId, input.objectId);
      await prisma.$transaction(
        input.fieldIds.map((id, position) =>
          prisma.crmField.update({ where: { id }, data: { position } }),
        ),
      );
      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ fieldId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const field = await prisma.crmField.findUniqueOrThrow({ where: { id: input.fieldId } });
      const object = await assertObjectAccess(ctx.userId, field.objectId, "ADMIN");
      const remaining = await prisma.crmField.count({ where: { objectId: field.objectId } });
      if (remaining <= 1) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "An object needs at least one field." });
      }
      await prisma.crmField.delete({ where: { id: input.fieldId } });
      await logAudit({
        organizationId: object.organizationId,
        userId: ctx.userId,
        action: "field.deleted",
        metadata: { fieldId: field.id, name: field.name, objectId: field.objectId },
      });
      return { ok: true };
    }),
});
