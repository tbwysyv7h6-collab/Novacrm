import { notFound } from "next/navigation";
import { prisma } from "@novacrm/db";
import { auth } from "@/lib/auth";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
    include: { organization: true },
  });
  if (!membership) notFound();

  const objects = await prisma.crmObject.findMany({
    where: { organizationId: orgId },
    orderBy: { position: "asc" },
  });

  return (
    <div className="-m-6 flex min-h-[calc(100vh-57px)] flex-col md:flex-row">
      <WorkspaceSidebar organization={membership.organization} initialObjects={objects} />
      <div className="flex-1 overflow-x-auto p-4 md:p-6">{children}</div>
    </div>
  );
}
