import Link from "next/link";
import { Sparkles } from "lucide-react";
import { prisma } from "@novacrm/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog";

export default async function WorkspaceListPage() {
  const session = await auth();
  const memberships = session?.user?.id
    ? await prisma.membership.findMany({
        where: { userId: session.user.id },
        include: { organization: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your CRMs</h1>
          <p className="text-muted-foreground">Pick a workspace or start a new one.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/app/new" />}>
            <Sparkles className="size-4 text-primary" />
            Build with AI
          </Button>
          <CreateWorkspaceDialog />
        </div>
      </div>

      {memberships.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          You don&apos;t have a CRM yet — create your first one to get started.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map((membership) => (
            <Link key={membership.id} href={`/app/${membership.organizationId}`}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="text-base">{membership.organization.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Role: {membership.role} · Plan: {membership.organization.plan}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
