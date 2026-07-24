import { prisma } from "@novacrm/db";
import { auth } from "@/lib/auth";
import { SettingsNav } from "@/components/workspace/settings-nav";
import { MembersPanel } from "@/components/workspace/members-panel";

export default async function MembersSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const session = await auth();

  const [organization, members, invites, myMembership] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: orgId }, select: { plan: true } }),
    prisma.membership.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organizationInvite.findMany({
      where: { organizationId: orgId, acceptedAt: null, expires: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
    session?.user?.id
      ? prisma.membership.findUnique({
          where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
        })
      : null,
  ]);

  const isAdmin = myMembership?.role === "OWNER" || myMembership?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <SettingsNav orgId={orgId} />
      <MembersPanel
        organizationId={orgId}
        plan={organization.plan}
        isAdmin={isAdmin}
        members={members}
        invites={invites}
      />
    </div>
  );
}
