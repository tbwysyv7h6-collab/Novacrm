import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

export type InvoicePdfLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
};

export type InvoicePdfData = {
  organization: {
    name: string;
    businessAddress: string | null;
    vatNumber: string | null;
    brandColor: string | null;
  };
  invoice: {
    number: string;
    status: string;
    customerName: string;
    customerEmail: string | null;
    customerAddress: string | null;
    issuedAt: Date | null;
    dueAt: Date | null;
    notes: string | null;
    subtotal: number;
    vatAmount: number;
    total: number;
    lineItems: InvoicePdfLineItem[];
  };
};

function formatCurrency(value: number): string {
  return `£${value.toFixed(2)}`;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111827" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  businessName: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  muted: { color: "#6b7280" },
  invoiceTitle: { fontSize: 20, fontWeight: 700, textAlign: "right" },
  invoiceNumber: { fontSize: 10, textAlign: "right", marginTop: 2, color: "#6b7280" },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 9, textTransform: "uppercase", color: "#6b7280", marginBottom: 4 },
  detailsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  table: { marginTop: 8 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnitPrice: { flex: 1, textAlign: "right" },
  colVat: { flex: 1, textAlign: "right" },
  colLineTotal: { flex: 1, textAlign: "right" },
  tableHeaderText: { fontSize: 9, textTransform: "uppercase", color: "#6b7280" },
  totals: { marginTop: 16, alignItems: "flex-end" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", width: 200, marginBottom: 4 },
  totalsLabel: { color: "#6b7280" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
  },
  grandTotalLabel: { fontWeight: 700 },
  grandTotalValue: { fontWeight: 700 },
  notes: { marginTop: 24, fontSize: 9, color: "#6b7280" },
});

function InvoiceDocument({ organization, invoice }: InvoicePdfData) {
  const accent = organization.brandColor ?? "#4f46e5";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.businessName}>{organization.name}</Text>
            {organization.businessAddress && (
              <Text style={styles.muted}>{organization.businessAddress}</Text>
            )}
            {organization.vatNumber && (
              <Text style={styles.muted}>VAT No. {organization.vatNumber}</Text>
            )}
          </View>
          <View>
            <Text style={[styles.invoiceTitle, { color: accent }]}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.number}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View>
            <Text style={styles.sectionLabel}>Billed to</Text>
            <Text>{invoice.customerName}</Text>
            {invoice.customerAddress && <Text style={styles.muted}>{invoice.customerAddress}</Text>}
            {invoice.customerEmail && <Text style={styles.muted}>{invoice.customerEmail}</Text>}
          </View>
          <View>
            <Text style={styles.sectionLabel}>Issued</Text>
            <Text>{formatDate(invoice.issuedAt)}</Text>
            <View style={{ height: 8 }} />
            <Text style={styles.sectionLabel}>Due</Text>
            <Text>{formatDate(invoice.dueAt)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDescription, styles.tableHeaderText]}>Description</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>Qty</Text>
            <Text style={[styles.colUnitPrice, styles.tableHeaderText]}>Unit price</Text>
            <Text style={[styles.colVat, styles.tableHeaderText]}>VAT</Text>
            <Text style={[styles.colLineTotal, styles.tableHeaderText]}>Amount</Text>
          </View>
          {invoice.lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnitPrice}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.colVat}>{item.vatRate}%</Text>
              <Text style={styles.colLineTotal}>{formatCurrency(item.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>VAT</Text>
            <Text>{formatCurrency(invoice.vatAmount)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total due</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument {...data} />);
}
