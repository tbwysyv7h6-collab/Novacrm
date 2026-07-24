import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/#builder", label: "Drag-and-drop builder" },
      { href: "/#ai", label: "AI CRM Builder" },
      { href: "/#automations", label: "Automations" },
      { href: "/#pricing", label: "Pricing" },
    ],
  },
  {
    title: "Use cases",
    links: [
      { href: "/crm-for-window-cleaning", label: "Window cleaning CRM" },
      { href: "/crm-for-plumbers", label: "Plumber CRM" },
      { href: "/crm-for-electricians", label: "Electrician CRM" },
      { href: "/crm-for-estate-agents", label: "Estate agent CRM" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Nova<span className="text-primary">CRM</span>
            </Link>
            <p className="mt-3 max-w-[20ch] text-sm text-muted-foreground">
              The easiest CRM builder in the world.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-medium">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NovaCRM. All rights reserved.</p>
          <p>Build a CRM. No code required.</p>
        </div>
      </div>
    </footer>
  );
}
