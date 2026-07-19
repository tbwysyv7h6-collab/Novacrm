import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@novacrm/db";
import { router, protectedProcedure } from "../trpc";
import { requireMembership } from "../membership";
import { getStripe, getPriceId } from "@/lib/stripe";

const paidPlanSchema = z.enum(["STARTER", "PRO", "BUSINESS"]);

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export const billingRouter = router({
  createCheckoutSession: protectedProcedure
    .input(z.object({ organizationId: z.string(), plan: paidPlanSchema }))
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "OWNER");
      const organization = await prisma.organization.findUniqueOrThrow({
        where: { id: input.organizationId },
      });
      const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.userId } });

      let stripe;
      let priceId;
      try {
        stripe = getStripe();
        priceId = getPriceId(input.plan);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Billing is not configured.",
        });
      }

      const customerId =
        organization.stripeCustomerId ??
        (
          await stripe.customers.create({
            email: user.email,
            name: organization.name,
            metadata: { organizationId: organization.id },
          })
        ).id;

      if (!organization.stripeCustomerId) {
        await prisma.organization.update({
          where: { id: organization.id },
          data: { stripeCustomerId: customerId },
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          // Only first-time subscribers get a trial - Stripe won't grant a second
          // trial to a customer with prior subscription history anyway, but being
          // explicit avoids relying on that implicit behaviour.
          trial_period_days: organization.stripeSubscriptionId ? undefined : 14,
        },
        success_url: `${siteUrl()}/app/${organization.id}/settings/billing?checkout=success`,
        cancel_url: `${siteUrl()}/app/${organization.id}/settings/billing?checkout=cancelled`,
        client_reference_id: organization.id,
      });

      if (!session.url) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not start checkout." });
      }

      return { url: session.url };
    }),

  createPortalSession: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "OWNER");
      const organization = await prisma.organization.findUniqueOrThrow({
        where: { id: input.organizationId },
      });

      if (!organization.stripeCustomerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This workspace doesn't have a billing account yet.",
        });
      }

      const stripe = getStripe();
      const session = await stripe.billingPortal.sessions.create({
        customer: organization.stripeCustomerId,
        return_url: `${siteUrl()}/app/${organization.id}/settings/billing`,
      });

      return { url: session.url };
    }),
});
