import { notFound } from "next/navigation";
import { prisma } from "@novacrm/db";
import { ViewSwitcher } from "@/components/workspace/view-switcher";
import { ObjectHeader } from "@/components/workspace/object-header";

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
      <ObjectHeader icon={object.icon} name={object.name} />
      <ViewSwitcher object={object} organizationId={orgId} relationTargets={otherObjects} />
    </div>
  );
}
