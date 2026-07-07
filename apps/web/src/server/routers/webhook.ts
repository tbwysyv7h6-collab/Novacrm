import crypto from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@novacrm/db";
import { router, protectedProcedure } from "../trpc";
import { requireMembership } from "../membership";
import { logAudit } from "../audit";

const webhookEventSchema = z.enum(["record.created", "record.updated"]);

export const webhookRouter = router({
  list: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "ADMIN");
      return prisma.webhook.findMany({
        where: { organizationId: input.organizationId },
        orderBy: { createdAt: "desc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        url: z.string().url(),
        events: z.array(webhookEventSchema).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "ADMIN");
      const organization = await prisma.organization.findUniqueOrThrow({
        where: { id: input.organizationId },
        select: { plan: true },
      });
      if (organization.plan !== "PRO" && organization.plan !== "BUSINESS") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Integrations require the Pro plan or higher.",
        });
      }
      const webhook = await prisma.webhook.create({
        data: {
          organizationId: input.organizationId,
          url: input.url,
          events: input.events,
          secret: crypto.randomBytes(24).toString("hex"),
        },
      });
      await logAudit({
        organizationId: input.organizationId,
        userId: ctx.userId,
        action: "webhook.created",
        metadata: { webhookId: webhook.id, url: webhook.url },
      });
      return webhook;
    }),

  toggle: protectedProcedure
    .input(z.object({ webhookId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await prisma.webhook.findUniqueOrThrow({ where: { id: input.webhookId } });
      await requireMembership(ctx.userId, webhook.organizationId, "ADMIN");
      return prisma.webhook.update({
        where: { id: input.webhookId },
        data: { isActive: input.isActive },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await prisma.webhook.findUniqueOrThrow({ where: { id: input.webhookId } });
      await requireMembership(ctx.userId, webhook.organizationId, "ADMIN");
      await prisma.webhook.delete({ where: { id: input.webhookId } });
      await logAudit({
        organizationId: webhook.organizationId,
        userId: ctx.userId,
        action: "webhook.deleted",
        metadata: { webhookId: webhook.id, url: webhook.url },
      });
      return { ok: true };
    }),
});
