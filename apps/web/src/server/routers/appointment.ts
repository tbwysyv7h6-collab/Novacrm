import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@novacrm/db";
import { router, protectedProcedure } from "../trpc";
import { requireMembership } from "../membership";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm");

export const appointmentRouter = router({
  listAvailabilityRules: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId);
      return prisma.availabilityRule.findMany({
        where: { organizationId: input.organizationId },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });
    }),

  setAvailabilityRules: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        rules: z.array(
          z.object({
            dayOfWeek: z.number().int().min(0).max(6),
            startTime: timeSchema,
            endTime: timeSchema,
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "MEMBER");

      const organization = await prisma.organization.findUniqueOrThrow({
        where: { id: input.organizationId },
        select: { plan: true },
      });
      if (organization.plan === "FREE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Appointment booking requires the Starter plan or above.",
        });
      }

      await prisma.$transaction([
        prisma.availabilityRule.deleteMany({ where: { organizationId: input.organizationId } }),
        prisma.availabilityRule.createMany({
          data: input.rules.map((rule) => ({ organizationId: input.organizationId, ...rule })),
        }),
      ]);

      return prisma.availabilityRule.findMany({
        where: { organizationId: input.organizationId },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });
    }),

  listAvailabilityBlocks: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId);
      return prisma.availabilityBlock.findMany({
        where: { organizationId: input.organizationId, date: { gte: new Date() } },
        orderBy: { date: "asc" },
      });
    }),

  addAvailabilityBlock: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        date: z.string().datetime(),
        reason: z.string().trim().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "MEMBER");
      return prisma.availabilityBlock.create({
        data: { organizationId: input.organizationId, date: new Date(input.date), reason: input.reason },
      });
    }),

  removeAvailabilityBlock: protectedProcedure
    .input(z.object({ blockId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const block = await prisma.availabilityBlock.findUniqueOrThrow({ where: { id: input.blockId } });
      await requireMembership(ctx.userId, block.organizationId, "MEMBER");
      await prisma.availabilityBlock.delete({ where: { id: input.blockId } });
      return { ok: true };
    }),

  updateBookingSettings: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        appointmentDurationMinutes: z.number().int().min(5).max(480),
        bookingWindowDays: z.number().int().min(1).max(90),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "ADMIN");
      return prisma.organization.update({
        where: { id: input.organizationId },
        data: {
          appointmentDurationMinutes: input.appointmentDurationMinutes,
          bookingWindowDays: input.bookingWindowDays,
        },
      });
    }),

  list: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId);
      return prisma.appointment.findMany({
        where: { organizationId: input.organizationId, startsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
      });
    }),

  cancel: protectedProcedure
    .input(z.object({ appointmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const appointment = await prisma.appointment.findUniqueOrThrow({
        where: { id: input.appointmentId },
      });
      await requireMembership(ctx.userId, appointment.organizationId, "MEMBER");
      return prisma.appointment.update({
        where: { id: input.appointmentId },
        data: { status: "CANCELLED" },
      });
    }),
});
