import type { Metadata } from "next";
import { Phone, FileText, ClipboardList } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { UseCaseLanding, type UseCaseContent } from "@/components/marketing/use-case-landing";

export const metadata: Metadata = {
  title: "CRM for Plumbers",
  description:
    "A CRM built for plumbers — from emergency call-outs to bathroom refit quotes, keep every job, customer, and invoice in one place.",
  alternates: {
    canonical: "/crm-for-plumbers",
  },
};

const content: UseCaseContent = {
  trade: "Plumbing",
  headline: "The CRM built for plumbers who quote, fix, and invoice",
  subhead:
    "From a Sunday emergency call-out to a bathroom refit quote — keep every job, customer, and invoice in one place.",
  painPoints: [
    {
      icon: Phone,
      title: "Emergency call-outs come in fast",
      body: "You're under a sink, not at a desk. A missed call with no record of what they needed is a lost job.",
    },
    {
      icon: FileText,
      title: "Quotes take too long to send",
      body: "Writing a quote from scratch for every bathroom refit or boiler swap eats into billable hours.",
    },
    {
      icon: ClipboardList,
      title: "Job history is scattered",
      body: "Which property had the leak last year? What parts did you use? Without a record, you're guessing.",
    },
  ],
  objects: [
    { icon: "👤", name: "Customers", fields: ["Name", "Property address", "Phone", "Notes"] },
    { icon: "🔧", name: "Jobs", fields: ["Status", "Job type", "Customer", "Callout date"] },
    { icon: "📝", name: "Quotes", fields: ["Customer", "Price", "Status", "Valid until"] },
    { icon: "🧾", name: "Invoices", fields: ["Job", "Amount", "Status", "Due date"] },
  ],
  pipeline: [
    { name: "Enquiry", description: "Call or message in" },
    { name: "Quoted", description: "Price sent" },
    { name: "Scheduled", description: "Callout booked" },
    { name: "Completed", description: "Job done" },
    { name: "Invoiced", description: "Bill sent" },
  ],
  automations: [
    {
      trigger: "A job is marked Completed",
      action: "Create a task to send the invoice",
    },
    {
      trigger: "A quote's status changes to Accepted",
      action: "Send the customer a confirmation email with the scheduled date",
    },
  ],
};

export default function PlumbersPage() {
  return (
    <>
      <SiteHeader />
      <UseCaseLanding content={content} />
      <SiteFooter />
    </>
  );
}
