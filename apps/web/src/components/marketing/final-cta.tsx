import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-muted/30 px-8 py-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent)]"
        />
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Build the CRM your business actually needs
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          No code. No developers. No compromise. Just describe your business, or
          start dragging and dropping.
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
            Start building for free
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
