"use client";

import Link from "next/link";
import { Lock, Plus, Receipt } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus, PlanTier } from "@novacrm/db";

const STATUS_BADGE: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "ghost" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SENT: { label: "Sent", variant: "outline" },
  PAID: { label: "Paid", variant: "default" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  VOID: { label: "Void", variant: "ghost" },
};

export function InvoicesPanel({ organizationId, plan }: { organizationId: string; plan: PlanTier }) {
  const { data: invoices = [] } = trpc.invoice.list.useQuery(
    { organizationId },
    { enabled: plan !== "FREE" },
  );

  if (plan === "FREE") {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <Lock className="size-6 text-muted-foreground" />
        <div>
          <p className="font-medium">Invoicing is a Starter feature</p>
          <p className="text-sm text-muted-foreground">
            Upgrade to Starter or above to send professional, VAT-ready invoices.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href={`/app/${organizationId}/settings/billing`} />}>
          Upgrade to Starter
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button nativeButton={false} render={<Link href={`/app/${organizationId}/invoices/new`} />}>
          <Plus className="size-4" />
          New invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Receipt className="mx-auto mb-3 size-6" />
          No invoices yet.
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2.5 font-medium">Number</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Due</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/${organizationId}/invoices/${invoice.id}`}
                      className="font-medium hover:underline"
                    >
                      {invoice.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{invoice.customerName}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE[invoice.status].variant}>
                      {STATUS_BADGE[invoice.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {invoice.dueAt
                      ? new Date(invoice.dueAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">£{invoice.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
