export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  category: "Email" | "Calendar" | "Payments" | "Communication" | "Automation" | "Accounting";
}

// Every entry here is "coming soon" until it gets a real connector — add new
// integrations by extending this list plus a handler under src/server/integrations.
export const COMING_SOON_INTEGRATIONS: IntegrationDefinition[] = [
  { id: "gmail", name: "Gmail", description: "Sync emails with contacts", category: "Email" },
  { id: "outlook", name: "Outlook", description: "Sync emails with contacts", category: "Email" },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Two-way calendar sync",
    category: "Calendar",
  },
  { id: "paypal", name: "PayPal", description: "Accept payments and sync invoices", category: "Payments" },
  { id: "slack", name: "Slack", description: "Get notified on new leads and deals", category: "Communication" },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Get notified on new leads and deals",
    category: "Communication",
  },
  { id: "zapier", name: "Zapier", description: "Connect to thousands of apps", category: "Automation" },
  { id: "make", name: "Make", description: "Build advanced automation scenarios", category: "Automation" },
  { id: "quickbooks", name: "QuickBooks", description: "Sync invoices and payments", category: "Accounting" },
  { id: "xero", name: "Xero", description: "Sync invoices and payments", category: "Accounting" },
  { id: "mailchimp", name: "Mailchimp", description: "Sync contacts to email lists", category: "Email" },
];
