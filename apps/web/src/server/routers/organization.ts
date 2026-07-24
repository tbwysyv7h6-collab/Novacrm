import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@novacrm/db";
import { router, protectedProcedure } from "../trpc";
import { requireMembership } from "../membership";
import { slugify, randomSuffix } from "@/lib/slug";
import { canCreateAdditionalOrg } from "@/lib/plan-limits";
import { logAudit } from "../audit";

async function uniqueOrgSlug(base: string): Promise<string> {
  const root = slugify(base) || "workspace";
  let slug = root;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${root}-${randomSuffix()}`;
  }
  return slug;
}

export const organizationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return prisma.membership.findMany({
      where: { userId: ctx.userId },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
  }),

  get: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId);
      return prisma.organization.findUniqueOrThrow({ where: { id: input.organizationId } });
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const ownedOrgs = await prisma.membership.findMany({
        where: { userId: ctx.userId, role: "OWNER" },
        include: { organization: { select: { plan: true } } },
      });
      if (!canCreateAdditionalOrg(ownedOrgs.map((m) => m.organization.plan))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "The Free plan is limited to 1 CRM. Upgrade to Pro to create multiple CRMs.",
        });
      }

      const slug = await uniqueOrgSlug(input.name);
      return prisma.organization.create({
        data: {
          name: input.name,
          slug,
          memberships: { create: { userId: ctx.userId, role: "OWNER" } },
        },
      });
    }),

  updateBranding: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().trim().min(1).max(100).optional(),
        logoUrl: z.string().url().optional().or(z.literal("")),
        brandColor: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
        businessAddress: z.string().trim().max(500).optional(),
        vatNumber: z.string().trim().max(30).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "ADMIN");
      const { organizationId, ...data } = input;
      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
          ...(data.brandColor && { brandColor: data.brandColor }),
          ...(data.businessAddress !== undefined && {
            businessAddress: data.businessAddress || null,
          }),
          ...(data.vatNumber !== undefined && { vatNumber: data.vatNumber || null }),
        },
      });
      await logAudit({
        organizationId,
        userId: ctx.userId,
        action: "organization.branding_updated",
        metadata: data,
      });
      return updated;
    }),

  members: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId);
      return prisma.membership.findMany({
        where: { organizationId: input.organizationId },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { createdAt: "asc" },
      });
    }),

  auditLog: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "ADMIN");
      const logs = await prisma.auditLog.findMany({
        where: { organizationId: input.organizationId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      const userIds = [...new Set(logs.map((l) => l.userId).filter((id): id is string => !!id))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      });
      const userById = new Map(users.map((u) => [u.id, u]));
      return logs.map((log) => ({ ...log, user: log.userId ? (userById.get(log.userId) ?? null) : null }));
    }),
});
