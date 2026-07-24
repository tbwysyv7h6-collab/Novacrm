import { InvoiceForm } from "@/components/workspace/invoice-form";

export default async function NewInvoicePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New invoice</h1>
      <InvoiceForm organizationId={orgId} />
    </div>
  );
}
