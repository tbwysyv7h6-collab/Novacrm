import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Card } from "@/components/ui/card";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Questions about ValensCRM, Enterprise plans, or custom contracts? Get in touch.",
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-lg flex-col items-center px-6 py-20">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Get in touch</h1>
          <p className="mt-3 text-muted-foreground">
            Questions, Enterprise plans, custom contracts — tell us a bit about what you need and
            we&apos;ll get back to you.
          </p>
        </div>
        <Card className="w-full p-6">
          <ContactForm />
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
