import { prisma } from "@novacrm/db";
import { SettingsNav } from "@/components/workspace/settings-nav";
import { BrandingForm } from "@/components/workspace/branding-form";
import { InvoicingSettingsForm } from "@/components/workspace/invoicing-settings-form";

export default async function GeneralSettingsPage({
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
      <div>
        <h2 className="mb-4 text-lg font-medium">Branding</h2>
        <BrandingForm organization={organization} />
      </div>
      <div>
        <h2 className="mb-4 text-lg font-medium">Invoicing details</h2>
        <InvoicingSettingsForm organization={organization} />
      </div>
    </div>
  );
}
