import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Card } from "@/components/ui/card";
import { DemoForm } from "./demo-form";

export const metadata: Metadata = {
  title: "Book a Demo",
  description: "See NovaCRM built around your business in a live 20-minute walkthrough.",
};

export default function DemoPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-lg flex-col items-center px-6 py-20">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Book a demo</h1>
          <p className="mt-3 text-muted-foreground">
            Tell us a bit about your business and we&apos;ll walk you through a NovaCRM built
            around exactly how you work — no obligation.
          </p>
        </div>
        <Card className="w-full p-6">
          <DemoForm />
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
