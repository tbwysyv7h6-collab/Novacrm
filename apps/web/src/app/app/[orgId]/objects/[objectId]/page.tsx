import { notFound } from "next/navigation";
import { prisma } from "@novacrm/db";
import { ViewSwitcher } from "@/components/workspace/view-switcher";

export default async function ObjectDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; objectId: string }>;
}) {
  const { orgId, objectId } = await params;

  const object = await prisma.crmObject.findUnique({
    where: { id: objectId },
    include: {
      fields: { orderBy: { position: "asc" } },
      views: { orderBy: { position: "asc" } },
    },
  });
  if (!object || object.organizationId !== orgId) notFound();

  const otherObjects = await prisma.crmObject.findMany({
    where: { organizationId: orgId, id: { not: objectId } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-lg">
          {object.icon || "📋"}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{object.name}</h1>
      </div>
      <ViewSwitcher object={object} organizationId={orgId} relationTargets={otherObjects} />
    </div>
  );
}
