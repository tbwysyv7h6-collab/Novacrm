import { notFound } from "next/navigation";
import { prisma } from "@novacrm/db";
import { InvoiceDetailView } from "@/components/workspace/invoice-detail-view";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; invoiceId: string }>;
}) {
  const { orgId, invoiceId } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });
  if (!invoice || invoice.organizationId !== orgId) notFound();

  return (
    <InvoiceDetailView
      organizationId={orgId}
      invoice={{
        ...invoice,
        subtotal: invoice.subtotal.toNumber(),
        vatAmount: invoice.vatAmount.toNumber(),
        total: invoice.total.toNumber(),
        lineItems: invoice.lineItems.map((item) => ({
          ...item,
          quantity: item.quantity.toNumber(),
          unitPrice: item.unitPrice.toNumber(),
          vatRate: item.vatRate.toNumber(),
          lineTotal: item.lineTotal.toNumber(),
        })),
      }}
    />
  );
}
