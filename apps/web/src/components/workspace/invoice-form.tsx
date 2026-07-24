"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { InvoiceLineItemsEditor } from "./invoice-line-items-editor";
import type { InvoiceLineItemInput } from "@/lib/invoice-calculations";

type ExistingInvoice = {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerAddress: string | null;
  notes: string | null;
  dueAt: string | Date | null;
  lineItems: InvoiceLineItemInput[];
};

export function InvoiceForm({
  organizationId,
  invoice,
}: {
  organizationId: string;
  invoice?: ExistingInvoice;
}) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState(invoice?.customerName ?? "");
  const [customerEmail, setCustomerEmail] = useState(invoice?.customerEmail ?? "");
  const [customerAddress, setCustomerAddress] = useState(invoice?.customerAddress ?? "");
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [dueAt, setDueAt] = useState(
    invoice?.dueAt ? new Date(invoice.dueAt).toISOString().slice(0, 10) : "",
  );
  const [lineItems, setLineItems] = useState<InvoiceLineItemInput[]>(
    invoice?.lineItems.length
      ? invoice.lineItems
      : [{ description: "", quantity: 1, unitPrice: 0, vatRate: 20 }],
  );
  const [error, setError] = useState<string | null>(null);

  const createInvoice = trpc.invoice.create.useMutation({
    onSuccess: (created) => router.push(`/app/${organizationId}/invoices/${created.id}`),
    onError: (err) => setError(err.message),
  });
  const updateInvoice = trpc.invoice.update.useMutation({
    onSuccess: (updated) => router.push(`/app/${organizationId}/invoices/${updated.id}`),
    onError: (err) => setError(err.message),
  });

  const isPending = createInvoice.isPending || updateInvoice.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (lineItems.some((item) => !item.description.trim())) {
      setError("Every line item needs a description.");
      return;
    }

    const payload = {
      customerName,
      customerEmail: customerEmail || undefined,
      customerAddress: customerAddress || undefined,
      notes: notes || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      lineItems,
    };

    if (invoice) {
      updateInvoice.mutate({ invoiceId: invoice.id, ...payload });
    } else {
      createInvoice.mutate({ organizationId, ...payload });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="customer-name">Customer name</Label>
          <Input
            id="customer-name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="customer-email">Customer email</Label>
          <Input
            id="customer-email"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="needed to email the invoice"
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="customer-address">Customer address</Label>
          <Input
            id="customer-address"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="due-at">Due date</Label>
          <Input id="due-at" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 font-medium">Line items</h3>
        <InvoiceLineItemsEditor lineItems={lineItems} onChange={setLineItems} />
      </Card>

      <Card className="p-5">
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Payment terms, thank-you note"
          />
        </div>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : invoice ? "Save changes" : "Create invoice"}
        </Button>
      </div>
    </form>
  );
}
