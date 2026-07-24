export type InvoiceLineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // percentage, e.g. 20 for 20%
};

export type CalculatedLineItem = InvoiceLineItemInput & {
  lineTotal: number; // quantity * unitPrice, before VAT
  lineVat: number;
};

export type InvoiceTotals = {
  lineItems: CalculatedLineItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateInvoiceTotals(lineItems: InvoiceLineItemInput[]): InvoiceTotals {
  const calculated = lineItems.map((item) => {
    const lineTotal = round2(item.quantity * item.unitPrice);
    const lineVat = round2(lineTotal * (item.vatRate / 100));
    return { ...item, lineTotal, lineVat };
  });

  const subtotal = round2(calculated.reduce((sum, item) => sum + item.lineTotal, 0));
  const vatAmount = round2(calculated.reduce((sum, item) => sum + item.lineVat, 0));
  const total = round2(subtotal + vatAmount);

  return { lineItems: calculated, subtotal, vatAmount, total };
}
