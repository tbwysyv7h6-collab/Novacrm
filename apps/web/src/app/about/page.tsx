import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "ValensCRM is built by a solo founder tired of watching small service businesses get squeezed into CRM software built for enterprise sales teams.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">About ValensCRM</h1>

        <div className="mt-8 space-y-6 text-muted-foreground">
          <p>
            Most CRMs are built for enterprise sales teams, then squeezed to fit everyone else. A
            window cleaner, a plumber, an estate agent — none of them work the way a Fortune 500
            sales floor does, but they&apos;re handed the same software anyway. ValensCRM starts
            from the opposite direction: describe your business, or drag and drop the exact
            fields and pipelines you actually need, and get a CRM built around how you really
            work.
          </p>
          <p>
            ValensCRM is built and run by me, Ethen Beyer, a sole trader based in England. I&apos;m
            not a large company with a support queue — I build the product, and I read every
            email that comes in through the{" "}
            <Link href="/contact" className="text-foreground underline underline-offset-4">
              contact form
            </Link>
            .
          </p>
          <p>
            The goal is simple: give small service businesses the same kind of tailored, no-code
            tooling that used to require a developer or an expensive consultant, at a price that
            makes sense for a one-person or five-person team.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button nativeButton={false} render={<Link href="/register" />}>
            Build your CRM for free
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/demo" />}>
            See live demo
          </Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
