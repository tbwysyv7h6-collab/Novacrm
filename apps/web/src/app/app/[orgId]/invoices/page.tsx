import { prisma } from "@novacrm/db";
import { InvoicesPanel } from "@/components/workspace/invoices-panel";

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { plan: true },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">
          Create professional, VAT-ready invoices and email them to your customers.
        </p>
      </div>
      <InvoicesPanel organizationId={orgId} plan={organization.plan} />
    </div>
  );
}
