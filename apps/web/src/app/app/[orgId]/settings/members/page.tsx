import { prisma } from "@novacrm/db";
import { SettingsNav } from "@/components/workspace/settings-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MembersSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const members = await prisma.membership.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <SettingsNav orgId={orgId} />
      <div className="max-w-lg space-y-2">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{member.user.name ?? member.user.email}</p>
                <p className="text-xs text-muted-foreground">{member.user.email}</p>
              </div>
              <Badge variant="outline">{member.role}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
