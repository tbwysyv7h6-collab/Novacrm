"use client";

import { Check } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Organization } from "@novacrm/db";

const PLANS = [
  {
    plan: "STARTER" as const,
    name: "Starter",
    price: "£19/mo",
    features: ["Unlimited records", "Remove branding", "Basic automations", "Email support"],
  },
  {
    plan: "PRO" as const,
    name: "Pro",
    price: "£49/mo",
    features: ["Multiple CRMs", "Advanced automations", "Team collaboration", "API access", "Integrations"],
    highlighted: true,
  },
  {
    plan: "BUSINESS" as const,
    name: "Business",
    price: "£99/mo",
    features: ["Unlimited users", "Advanced permissions", "White label", "Priority support", "Advanced analytics"],
  },
];

export function BillingPanel({ organization }: { organization: Organization }) {
  const checkout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (result) => {
      window.location.href = result.url;
    },
  });
  const portal = trpc.billing.createPortalSession.useMutation({
    onSuccess: (result) => {
      window.location.href = result.url;
    },
  });

  return (
    <div className="space-y-6">
      <Card className="max-w-lg">
        <CardHeader>
          <p className="text-sm text-muted-foreground">Current plan</p>
          <p className="text-xl font-semibold">{organization.plan}</p>
        </CardHeader>
        {organization.stripeCustomerId && (
          <CardContent>
            <Button
              variant="outline"
              onClick={() => portal.mutate({ organizationId: organization.id })}
              disabled={portal.isPending}
            >
              {portal.isPending ? "Opening..." : "Manage billing"}
            </Button>
          </CardContent>
        )}
      </Card>

      {(checkout.error ?? portal.error) && (
        <p className="text-sm text-destructive">
          {checkout.error?.message ?? portal.error?.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.plan} className={cn(plan.highlighted && "border-primary")}>
            <CardHeader>
              <p className="font-medium">{plan.name}</p>
              <p className="text-2xl font-semibold tracking-tight">{plan.price}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={organization.plan === plan.plan ? "outline" : "default"}
                disabled={organization.plan === plan.plan || checkout.isPending}
                onClick={() => checkout.mutate({ organizationId: organization.id, plan: plan.plan })}
              >
                {organization.plan === plan.plan
                  ? "Current plan"
                  : checkout.isPending
                    ? "Redirecting..."
                    : `Upgrade to ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
