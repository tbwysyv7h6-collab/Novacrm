import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@novacrm/db";
import { router, protectedProcedure } from "../trpc";
import { requireMembership } from "../membership";
import { slugify, randomSuffix } from "@/lib/slug";
import { canCreateAdditionalOrg, canAccessPlan } from "@/lib/plan-limits";
import { logAudit } from "../audit";
import { issueInvite } from "../invites";

const assignableRoleSchema = z.enum(["ADMIN", "MEMBER", "VIEWER"]);

async function assertNotLastOwner(membershipId: string) {
  const membership = await prisma.membership.findUniqueOrThrow({ where: { id: membershipId } });
  if (membership.role !== "OWNER") return membership;
  const ownerCount = await prisma.membership.count({
    where: { organizationId: membership.organizationId, role: "OWNER" },
  });
  if (ownerCount <= 1) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "An organization must have at least one owner.",
    });
  }
  return membership;
}

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

  inviteMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.string().trim().toLowerCase().email(),
        role: assignableRoleSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "ADMIN");

      const organization = await prisma.organization.findUniqueOrThrow({
        where: { id: input.organizationId },
        select: { name: true, plan: true },
      });
      if (!canAccessPlan(organization.plan, "PRO")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Inviting teammates requires the Pro plan or higher. Upgrade to invite your team.",
        });
      }

      const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
      if (existingUser) {
        const existingMembership = await prisma.membership.findUnique({
          where: { userId_organizationId: { userId: existingUser.id, organizationId: input.organizationId } },
        });
        if (existingMembership) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "That person is already a member of this workspace.",
          });
        }
      }

      const inviter = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { name: true, email: true },
      });

      await issueInvite({
        organizationId: input.organizationId,
        organizationName: organization.name,
        email: input.email,
        role: input.role,
        invitedById: ctx.userId,
        inviterName: inviter?.name ?? inviter?.email ?? "A teammate",
      });

      return { ok: true };
    }),

  listInvites: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "ADMIN");
      return prisma.organizationInvite.findMany({
        where: { organizationId: input.organizationId, acceptedAt: null, expires: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });
    }),

  revokeInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await prisma.organizationInvite.findUniqueOrThrow({ where: { id: input.inviteId } });
      await requireMembership(ctx.userId, invite.organizationId, "ADMIN");
      await prisma.organizationInvite.delete({ where: { id: input.inviteId } });
      return { ok: true };
    }),

  removeMember: protectedProcedure
    .input(z.object({ membershipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await assertNotLastOwner(input.membershipId);
      await requireMembership(ctx.userId, membership.organizationId, "ADMIN");
      await prisma.membership.delete({ where: { id: input.membershipId } });
      return { ok: true };
    }),

  updateMemberRole: protectedProcedure
    .input(z.object({ membershipId: z.string(), role: assignableRoleSchema }))
    .mutation(async ({ ctx, input }) => {
      const membership = await assertNotLastOwner(input.membershipId);
      await requireMembership(ctx.userId, membership.organizationId, "ADMIN");
      return prisma.membership.update({ where: { id: input.membershipId }, data: { role: input.role } });
    }),

  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await prisma.organizationInvite.findUnique({ where: { token: input.token } });
      if (!invite || invite.acceptedAt || invite.expires < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invite is invalid or has expired." });
      }
      if (ctx.session?.user?.email?.toLowerCase() !== invite.email.toLowerCase()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invite is for a different email address.",
        });
      }

      const organizationId = await prisma.$transaction(async (tx) => {
        await tx.membership.upsert({
          where: { userId_organizationId: { userId: ctx.userId, organizationId: invite.organizationId } },
          create: { userId: ctx.userId, organizationId: invite.organizationId, role: invite.role },
          update: { role: invite.role },
        });
        await tx.organizationInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
        return invite.organizationId;
      });

      return { organizationId };
    }),
});
