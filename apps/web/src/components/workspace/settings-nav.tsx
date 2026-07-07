"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SettingsNav({ orgId }: { orgId: string }) {
  const pathname = usePathname();
  const items = [
    { href: `/app/${orgId}/settings`, label: "General" },
    { href: `/app/${orgId}/settings/members`, label: "Members" },
    { href: `/app/${orgId}/settings/billing`, label: "Billing" },
    { href: `/app/${orgId}/settings/integrations`, label: "Integrations" },
    { href: `/app/${orgId}/settings/activity`, label: "Activity" },
  ];

  return (
    <nav className="flex gap-1 border-b pb-px">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-t-md border-b-2 px-3 py-2 text-sm transition-colors",
            pathname === item.href
              ? "border-primary font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
