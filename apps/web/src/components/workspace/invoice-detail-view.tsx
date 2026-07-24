"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Mail, Check, Ban, Trash2, Pencil } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@novacrm/db";

const STATUS_BADGE: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "ghost" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SENT: { label: "Sent", variant: "outline" },
  PAID: { label: "Paid", variant: "default" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  VOID: { label: "Void", variant: "ghost" },
};

type InvoiceDetail = {
  id: string;
  number: string;
  status: InvoiceStatus;
  customerName: string;
  customerEmail: string | null;
  customerAddress: string | null;
  notes: string | null;
  dueAt: string | Date | null;
  issuedAt: string | Date | null;
  subtotal: number;
  vatAmount: number;
  total: number;
  lineItems: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    lineTotal: number;
  }[];
};

function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function InvoiceDetailView({
  organizationId,
  invoice,
}: {
  organizationId: string;
  invoice: InvoiceDetail;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const invalidate = () => utils.invoice.get.invalidate({ invoiceId: invoice.id });

  const sendInvoice = trpc.invoice.send.useMutation({
    onSuccess: () => {
      setSent(true);
      setTimeout(() => setSent(false), 2500);
      invalidate();
    },
    onError: (err) => setError(err.message),
  });
  const markPaid = trpc.invoice.markPaid.useMutation({ onSuccess: invalidate });
  const voidInvoice = trpc.invoice.void.useMutation({ onSuccess: invalidate });
  const deleteInvoice = trpc.invoice.delete.useMutation({
    onSuccess: () => router.push(`/app/${organizationId}/invoices`),
  });

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{invoice.number}</h1>
          <p className="text-muted-foreground">{invoice.customerName}</p>
        </div>
        <Badge variant={STATUS_BADGE[invoice.status].variant}>
          {STATUS_BADGE[invoice.status].label}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" />}
        >
          <Download className="size-4" />
          Download PDF
        </Button>
        {invoice.status === "DRAFT" && (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/app/${organizationId}/invoices/${invoice.id}/edit`} />}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        )}
        {invoice.customerEmail && invoice.status !== "VOID" && (
          <Button
            variant="outline"
            onClick={() => sendInvoice.mutate({ invoiceId: invoice.id })}
            disabled={sendInvoice.isPending}
          >
            <Mail className="size-4" />
            {sendInvoice.isPending ? "Sending..." : sent ? "Sent!" : "Email to customer"}
          </Button>
        )}
        {invoice.status !== "PAID" && invoice.status !== "VOID" && (
          <Button
            variant="outline"
            onClick={() => markPaid.mutate({ invoiceId: invoice.id })}
            disabled={markPaid.isPending}
          >
            <Check className="size-4" />
            Mark as paid
          </Button>
        )}
        {invoice.status === "DRAFT" ? (
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => deleteInvoice.mutate({ invoiceId: invoice.id })}
            disabled={deleteInvoice.isPending}
          >
            <Trash2 className="size-4" />
            Delete draft
          </Button>
        ) : (
          invoice.status !== "VOID" && (
            <Button
              variant="ghost"
              onClick={() => voidInvoice.mutate({ invoiceId: invoice.id })}
              disabled={voidInvoice.isPending}
            >
              <Ban className="size-4" />
              Void
            </Button>
          )
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="p-5">
        <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Issued</p>
            <p>{formatDate(invoice.issuedAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Due</p>
            <p>{formatDate(invoice.dueAt)}</p>
          </div>
          {invoice.customerEmail && (
            <div>
              <p className="text-muted-foreground">Customer email</p>
              <p>{invoice.customerEmail}</p>
            </div>
          )}
          {invoice.customerAddress && (
            <div>
              <p className="text-muted-foreground">Customer address</p>
              <p>{invoice.customerAddress}</p>
            </div>
          )}
        </div>

        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 font-medium">Qty</th>
              <th className="py-2 font-medium">Unit price</th>
              <th className="py-2 font-medium">VAT</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2">{item.description}</td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2">£{item.unitPrice.toFixed(2)}</td>
                <td className="py-2">{item.vatRate}%</td>
                <td className="py-2 text-right">£{item.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-4 flex max-w-56 flex-col gap-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>£{invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>VAT</span>
            <span>£{invoice.vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 font-medium">
            <span>Total</span>
            <span>£{invoice.total.toFixed(2)}</span>
          </div>
        </div>

        {invoice.notes && (
          <p className="mt-4 text-sm text-muted-foreground">{invoice.notes}</p>
        )}
      </Card>
    </div>
  );
}
