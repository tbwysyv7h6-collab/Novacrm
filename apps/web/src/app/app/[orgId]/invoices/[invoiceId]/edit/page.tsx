import { notFound } from "next/navigation";
import { prisma } from "@novacrm/db";
import { InvoiceForm } from "@/components/workspace/invoice-form";

export default async function EditInvoicePage({
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
  if (invoice.status !== "DRAFT") notFound();

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Edit {invoice.number}</h1>
      <InvoiceForm
        organizationId={orgId}
        invoice={{
          ...invoice,
          lineItems: invoice.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity.toNumber(),
            unitPrice: item.unitPrice.toNumber(),
            vatRate: item.vatRate.toNumber(),
          })),
        }}
      />
    </div>
  );
}
