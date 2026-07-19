import type { Metadata } from "next";
import Script from "next/script";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Hero } from "@/components/marketing/hero";
import { BenefitsStrip } from "@/components/marketing/benefits-strip";
import { AudienceStrip } from "@/components/marketing/audience-strip";
import { AiBuilderSection } from "@/components/marketing/ai-builder-section";
import { BuilderSection } from "@/components/marketing/builder-section";
import { AutomationsSection } from "@/components/marketing/automations-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FinalCta } from "@/components/marketing/final-cta";

export const metadata: Metadata = {
  title: "NovaCRM — Build a Custom CRM in Minutes, No Code Required",
  description:
    "NovaCRM is the easiest CRM builder in the world. Drag-and-drop your own custom CRM, or describe your business and let AI build it for you. Made for tradespeople, agencies, and service businesses.",
  keywords: [
    "CRM Builder",
    "Build a CRM",
    "Custom CRM",
    "CRM Software",
    "CRM Creator",
    "CRM Generator",
    "Online CRM Builder",
    "No-code CRM",
  ],
  openGraph: {
    title: "NovaCRM — Build a Custom CRM in Minutes, No Code Required",
    description:
      "Drag-and-drop your own custom CRM, or describe your business and let AI build it for you.",
    type: "website",
    siteName: "NovaCRM",
  },
  twitter: {
    card: "summary_large_image",
    title: "NovaCRM — Build a Custom CRM in Minutes, No Code Required",
    description:
      "Drag-and-drop your own custom CRM, or describe your business and let AI build it for you.",
  },
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "NovaCRM",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "The easiest CRM builder in the world. Build a fully custom CRM with drag-and-drop, or generate one instantly with AI.",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "GBP" },
    { "@type": "Offer", name: "Starter", price: "19", priceCurrency: "GBP" },
    { "@type": "Offer", name: "Pro", price: "49", priceCurrency: "GBP" },
    { "@type": "Offer", name: "Business", price: "99", priceCurrency: "GBP" },
  ],
};

export default function Home() {
  return (
    <>
      <Script
        id="software-application-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <BenefitsStrip />
        <AudienceStrip />
        <AiBuilderSection />
        <BuilderSection />
        <AutomationsSection />
        <PricingSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
