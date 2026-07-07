import { prisma } from "@novacrm/db";
import { SettingsNav } from "@/components/workspace/settings-nav";
import { BillingPanel } from "@/components/workspace/billing-panel";

export default async function BillingSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <SettingsNav orgId={orgId} />
      <BillingPanel organization={organization} />
    </div>
  );
}
