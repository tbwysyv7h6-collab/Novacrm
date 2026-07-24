import type { Metadata } from "next";
import { RefreshCw, PoundSterling, Users } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { UseCaseLanding, type UseCaseContent } from "@/components/marketing/use-case-landing";

export const metadata: Metadata = {
  title: "CRM for Window Cleaners",
  description:
    "A CRM built for window cleaning rounds — track customers, recurring visits, quotes, and payments without a paper diary or a spreadsheet only you understand.",
  alternates: {
    canonical: "/crm-for-window-cleaning",
  },
};

const content: UseCaseContent = {
  trade: "Window Cleaning",
  headline: "The CRM built for window cleaning rounds",
  subhead:
    "Track every customer, round, and payment without a paper diary or a spreadsheet that only makes sense to you.",
  painPoints: [
    {
      icon: RefreshCw,
      title: "Recurring rounds get messy",
      body: "Who's due this week, who's on a 4-week cycle, who got skipped for rain — it all lives in your head or a battered notebook.",
    },
    {
      icon: PoundSterling,
      title: "Chasing payment after every visit",
      body: "No easy way to see who's paid, who owes for two visits, and who needs a nudge.",
    },
    {
      icon: Users,
      title: "New enquiries fall through the cracks",
      body: "A quote request comes in on Facebook or a missed call, and by the time you're free to reply, they've booked someone else.",
    },
  ],
  objects: [
    { icon: "🏠", name: "Customers", fields: ["Address", "Round / day", "Access notes", "Phone"] },
    { icon: "🧽", name: "Jobs", fields: ["Status", "Customer", "Visit date", "Price"] },
    { icon: "📝", name: "Quotes", fields: ["Customer", "Price", "Status", "Sent date"] },
    { icon: "💷", name: "Payments", fields: ["Amount", "Method", "Job", "Paid on"] },
  ],
  pipeline: [
    { name: "Enquiry", description: "New request in" },
    { name: "Quoted", description: "Price sent" },
    { name: "Scheduled", description: "On the round" },
    { name: "Completed", description: "Visit done" },
    { name: "Paid", description: "Payment logged" },
  ],
  automations: [
    {
      trigger: "A job's status changes to Completed",
      action: "Send the customer a follow-up email asking for a review",
    },
    {
      trigger: "A new customer record is created",
      action: "Create a task to schedule their first visit",
    },
  ],
};

export default function WindowCleaningPage() {
  return (
    <>
      <SiteHeader />
      <UseCaseLanding content={content} />
      <SiteFooter />
    </>
  );
}
