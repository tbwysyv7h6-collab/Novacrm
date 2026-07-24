import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type UseCasePipelineStage = {
  name: string;
  description: string;
};

export type UseCaseObject = {
  icon: string;
  name: string;
  fields: string[];
};

export type UseCaseAutomation = {
  trigger: string;
  action: string;
};

export type UseCaseContent = {
  trade: string;
  headline: string;
  subhead: string;
  painPoints: { icon: LucideIcon; title: string; body: string }[];
  objects: UseCaseObject[];
  pipeline: UseCasePipelineStage[];
  automations: UseCaseAutomation[];
};

export function UseCaseLanding({ content }: { content: UseCaseContent }) {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden px-6 pt-20 pb-16 text-center sm:pt-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]"
        />
        <h1 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {content.headline}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          {content.subhead}
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
            Build your {content.trade} CRM for free
            <ArrowRight className="size-4" />
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/demo" />}>
            See live demo
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          What most {content.trade.toLowerCase()} businesses are stuck with
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {content.painPoints.map((point) => (
            <Card key={point.title} className="p-6">
              <point.icon className="size-5 text-primary" />
              <h3 className="mt-4 font-medium">{point.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{point.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/20 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            A CRM shaped like your business, not a sales textbook
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Every object below is one you drag, drop, and rename yourself — or describe your
            business to the AI builder and get this exact structure generated in under a minute.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {content.objects.map((object) => (
              <Card key={object.name} className="p-5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{object.icon}</span>
                  <span className="font-medium">{object.name}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {object.fields.map((field) => (
                    <span
                      key={field}
                      className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          A pipeline that matches how the work actually moves
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {content.pipeline.map((stage, i) => (
            <div key={stage.name} className="flex items-center gap-2">
              <Card className="w-40 p-4 text-center">
                <p className="text-sm font-medium">{stage.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stage.description}</p>
              </Card>
              {i < content.pipeline.length - 1 && (
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/20 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Automations that quietly do the follow-up for you
          </h2>
          <div className="mt-10 space-y-4">
            {content.automations.map((automation) => (
              <Card
                key={automation.trigger}
                className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  When
                </span>
                <p className="text-sm">{automation.trigger}</p>
                <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">Then</span>
                <p className="text-sm">{automation.action}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-muted/30 px-8 py-16 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent)]"
          />
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Build your {content.trade.toLowerCase()} CRM in the next 10 minutes
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Free to start, no card required. 14-day free trial on every paid plan.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
              Start building for free
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/demo" />}>
              See live demo
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
