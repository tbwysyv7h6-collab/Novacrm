"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateInvoiceTotals, type InvoiceLineItemInput } from "@/lib/invoice-calculations";

export function InvoiceLineItemsEditor({
  lineItems,
  onChange,
}: {
  lineItems: InvoiceLineItemInput[];
  onChange: (lineItems: InvoiceLineItemInput[]) => void;
}) {
  const totals = calculateInvoiceTotals(lineItems);

  function updateItem(index: number, patch: Partial<InvoiceLineItemInput>) {
    onChange(lineItems.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    onChange(lineItems.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...lineItems, { description: "", quantity: 1, unitPrice: 0, vatRate: 20 }]);
  }

  return (
    <div className="space-y-3">
      <div className="hidden gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_5rem_6rem_5rem_6rem_2rem]">
        <span>Description</span>
        <span>Qty</span>
        <span>Unit price</span>
        <span>VAT %</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {lineItems.map((item, i) => {
        const lineTotal = totals.lineItems[i]?.lineTotal ?? 0;
        return (
          <div
            key={i}
            className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_5rem_6rem_5rem_6rem_2rem] sm:items-center sm:border-0 sm:p-0"
          >
            <div className="col-span-2 sm:col-span-1">
              <Label className="sm:hidden">Description</Label>
              <Input
                value={item.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
                placeholder="e.g. Gutter clean, front and rear"
              />
            </div>
            <div>
              <Label className="sm:hidden">Qty</Label>
              <Input
                type="number"
                min={0}
                step="1"
                value={item.quantity}
                onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label className="sm:hidden">Unit price (£)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label className="sm:hidden">VAT %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={item.vatRate}
                onChange={(e) => updateItem(i, { vatRate: Number(e.target.value) })}
              />
            </div>
            <p className="text-right text-sm font-medium">£{lineTotal.toFixed(2)}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeItem(i)}
              disabled={lineItems.length === 1}
              aria-label="Remove line item"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="size-4" />
        Add line item
      </Button>

      <div className="ml-auto flex max-w-56 flex-col gap-1 pt-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>£{totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>VAT</span>
          <span>£{totals.vatAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t pt-1 font-medium">
          <span>Total</span>
          <span>£{totals.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
