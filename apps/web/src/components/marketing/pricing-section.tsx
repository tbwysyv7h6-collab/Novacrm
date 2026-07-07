import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    description: "Try NovaCRM with no commitment.",
    features: ["1 CRM", "Limited records", "NovaCRM branding", "Basic features"],
    cta: "Start for free",
    href: "/register",
  },
  {
    name: "Starter",
    price: "£19",
    period: "/month",
    description: "For freelancers and small teams.",
    features: [
      "Unlimited records",
      "Remove branding",
      "Basic automations",
      "Email support",
    ],
    cta: "Start with Starter",
    href: "/register?plan=starter",
  },
  {
    name: "Pro",
    price: "£49",
    period: "/month",
    description: "For growing service businesses.",
    features: [
      "Multiple CRMs",
      "Advanced automations",
      "Team collaboration",
      "API access",
      "Integrations",
    ],
    cta: "Start with Pro",
    href: "/register?plan=pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "£99",
    period: "/month",
    description: "For teams that need control at scale.",
    features: [
      "Unlimited users",
      "Advanced permissions",
      "White label",
      "Priority support",
      "Advanced analytics",
    ],
    cta: "Start with Business",
    href: "/register?plan=business",
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-border/60 bg-muted/20 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple pricing that grows with you
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when your CRM starts doing real work.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "flex flex-col",
                plan.highlighted && "border-primary shadow-lg shadow-primary/10",
              )}
            >
              <CardHeader>
                {plan.highlighted && (
                  <span className="mb-2 w-fit rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  nativeButton={false}
                  render={<Link href={plan.href} />}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Need advanced security, SSO, or custom contracts?{" "}
          <Link href="/contact" className="font-medium text-foreground hover:underline">
            Talk to us about Enterprise
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
