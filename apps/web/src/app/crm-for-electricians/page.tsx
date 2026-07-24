import type { Metadata } from "next";
import { ShieldCheck, Building2, Clock } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { UseCaseLanding, type UseCaseContent } from "@/components/marketing/use-case-landing";

export const metadata: Metadata = {
  title: "CRM for Electricians",
  description:
    "A CRM built for electricians — installs, testing, and certificate tracking for every property, without hunting through old texts and emails.",
  alternates: {
    canonical: "/crm-for-electricians",
  },
};

const content: UseCaseContent = {
  trade: "Electrical",
  headline: "The CRM built for electricians and their paperwork",
  subhead:
    "Installs, testing, and certificates for every property — without hunting through old texts and emails to find what you did last time.",
  painPoints: [
    {
      icon: ShieldCheck,
      title: "Certificates and test dates are easy to lose",
      body: "EICR renewals and inspection dates need chasing months in advance, not remembered on the day.",
    },
    {
      icon: Building2,
      title: "Commercial clients expect a paper trail",
      body: "Repeat commercial customers want a record of every visit — not a scramble through old invoices.",
    },
    {
      icon: Clock,
      title: "Quoting bigger installs takes time",
      body: "A rewire or consumer unit swap needs a proper quote, not a guess texted from the van.",
    },
  ],
  objects: [
    { icon: "👤", name: "Customers", fields: ["Name", "Property type", "Phone", "Notes"] },
    { icon: "⚡", name: "Jobs", fields: ["Status", "Job type", "Customer", "Visit date"] },
    { icon: "📝", name: "Quotes", fields: ["Customer", "Price", "Status", "Job type"] },
    { icon: "🧾", name: "Invoices", fields: ["Job", "Amount", "Status", "Due date"] },
  ],
  pipeline: [
    { name: "Enquiry", description: "New request in" },
    { name: "Quoted", description: "Price sent" },
    { name: "Scheduled", description: "Visit booked" },
    { name: "Completed", description: "Work done" },
    { name: "Invoiced", description: "Bill sent" },
  ],
  automations: [
    {
      trigger: "A job's status changes to Completed",
      action: "Update a field to log the completion date, ready for a certificate renewal reminder",
    },
    {
      trigger: "A new job record is created",
      action: "Assign it to the right team member",
    },
  ],
};

export default function ElectriciansPage() {
  return (
    <>
      <SiteHeader />
      <UseCaseLanding content={content} />
      <SiteFooter />
    </>
  );
}
