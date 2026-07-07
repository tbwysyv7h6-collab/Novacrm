import { prisma } from "@novacrm/db";
import { AutomationsPanel } from "@/components/workspace/automations-panel";

export default async function AutomationsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const objects = await prisma.crmObject.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Automations</h1>
        <p className="text-muted-foreground">
          IF something happens THEN NovaCRM takes care of it — no code required.
        </p>
      </div>
      <AutomationsPanel organizationId={orgId} objects={objects} />
    </div>
  );
}
