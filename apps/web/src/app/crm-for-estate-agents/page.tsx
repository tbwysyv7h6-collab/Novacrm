import type { Metadata } from "next";
import { Home, Calendar, RefreshCw } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { UseCaseLanding, type UseCaseContent } from "@/components/marketing/use-case-landing";

export const metadata: Metadata = {
  title: "CRM for Estate Agents",
  description:
    "A CRM built for matching applicants to listings — track vendors, properties, applicants, and viewings without three spreadsheets that never quite agree.",
  alternates: {
    canonical: "/crm-for-estate-agents",
  },
};

const content: UseCaseContent = {
  trade: "Estate Agent",
  headline: "The CRM built for matching applicants to the right listing",
  subhead:
    "Track every vendor, listing, applicant, and viewing without three different spreadsheets that never quite agree.",
  painPoints: [
    {
      icon: Home,
      title: "Listings and applicants live in different places",
      body: "Matching a new applicant to the right property means checking multiple lists by hand.",
    },
    {
      icon: Calendar,
      title: "Viewings get double-booked or forgotten",
      body: "Without one shared calendar, it's easy to lose track of who's viewing what and when.",
    },
    {
      icon: RefreshCw,
      title: "Following up after a viewing falls through the cracks",
      body: "A viewing happens, and if nobody follows up within a day or two, the applicant moves on.",
    },
  ],
  objects: [
    { icon: "🏠", name: "Vendors", fields: ["Name", "Property address", "Phone", "Status"] },
    { icon: "🔑", name: "Listings", fields: ["Address", "Price", "Status", "Vendor"] },
    { icon: "👤", name: "Applicants", fields: ["Name", "Budget", "Requirements", "Phone"] },
    { icon: "📅", name: "Viewings", fields: ["Listing", "Applicant", "Date", "Outcome"] },
  ],
  pipeline: [
    { name: "New listing", description: "Vendor onboarded" },
    { name: "Live", description: "On the market" },
    { name: "Viewings booked", description: "Interest lined up" },
    { name: "Offer", description: "Offer received" },
    { name: "Sold", description: "Deal agreed" },
  ],
  automations: [
    {
      trigger: "A viewing record is created",
      action: "Send a reminder email to the applicant the day before",
    },
    {
      trigger: "A listing's status changes to Under offer",
      action: "Send the vendor an update email",
    },
  ],
};

export default function EstateAgentsPage() {
  return (
    <>
      <SiteHeader />
      <UseCaseLanding content={content} />
      <SiteFooter />
    </>
  );
}
