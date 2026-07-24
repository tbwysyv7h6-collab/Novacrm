import { describe, expect, it } from "vitest";
import { calculateInvoiceTotals } from "./invoice-calculations";

describe("calculateInvoiceTotals", () => {
  it("computes a single line item at standard 20% VAT", () => {
    const result = calculateInvoiceTotals([
      { description: "Gutter clean", quantity: 1, unitPrice: 100, vatRate: 20 },
    ]);
    expect(result.subtotal).toBe(100);
    expect(result.vatAmount).toBe(20);
    expect(result.total).toBe(120);
    expect(result.lineItems[0].lineTotal).toBe(100);
    expect(result.lineItems[0].lineVat).toBe(20);
  });

  it("sums multiple line items with mixed VAT rates", () => {
    const result = calculateInvoiceTotals([
      { description: "Standard-rated work", quantity: 2, unitPrice: 50, vatRate: 20 },
      { description: "Zero-rated materials", quantity: 1, unitPrice: 30, vatRate: 0 },
    ]);
    // 2*50 = 100 @ 20% = 20 VAT; 30 @ 0% = 0 VAT
    expect(result.subtotal).toBe(130);
    expect(result.vatAmount).toBe(20);
    expect(result.total).toBe(150);
  });

  it("handles quantities and unit prices with pence-level rounding", () => {
    const result = calculateInvoiceTotals([
      { description: "Odd pricing", quantity: 3, unitPrice: 10.33, vatRate: 20 },
    ]);
    // 3 * 10.33 = 30.99, VAT = 6.198 -> rounds to 6.20
    expect(result.subtotal).toBe(30.99);
    expect(result.vatAmount).toBe(6.2);
    expect(result.total).toBe(37.19);
  });

  it("supports a reduced VAT rate", () => {
    const result = calculateInvoiceTotals([
      { description: "Reduced-rate item", quantity: 1, unitPrice: 200, vatRate: 5 },
    ]);
    expect(result.vatAmount).toBe(10);
    expect(result.total).toBe(210);
  });

  it("returns zero totals for an empty line item list", () => {
    const result = calculateInvoiceTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.total).toBe(0);
  });
});
