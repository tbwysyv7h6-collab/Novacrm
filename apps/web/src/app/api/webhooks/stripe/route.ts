import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@novacrm/db";
import { getStripe, planFromPriceId } from "@/lib/stripe";
import { logAudit } from "@/server/audit";

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const organization = await prisma.organization.findUnique({ where: { stripeCustomerId: customerId } });
  if (!organization) return;

  const item = subscription.items.data[0];
  const plan = item ? planFromPriceId(item.price.id) : null;
  const isActive = subscription.status === "active" || subscription.status === "trialing";
  const nextPlan = isActive && plan ? plan : "FREE";

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      plan: nextPlan,
      stripeSubscriptionId: subscription.id,
      stripePriceId: item?.price.id,
      stripeCurrentPeriodEnd: item?.current_period_end
        ? new Date(item.current_period_end * 1000)
        : null,
    },
  });

  if (nextPlan !== organization.plan) {
    await logAudit({
      organizationId: organization.id,
      action: "billing.plan_changed",
      metadata: { from: organization.plan, to: nextPlan, subscriptionStatus: subscription.status },
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const organization = await prisma.organization.findUnique({ where: { stripeCustomerId: customerId } });
  if (!organization) return;

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      plan: "FREE",
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  });

  await logAudit({
    organizationId: organization.id,
    action: "billing.subscription_cancelled",
    metadata: { from: organization.plan },
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 500 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing stripe-signature header");
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (typeof session.subscription === "string") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await syncSubscription(subscription);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      await syncSubscription(event.data.object);
      break;
    }
    case "customer.subscription.deleted": {
      await handleSubscriptionDeleted(event.data.object);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
