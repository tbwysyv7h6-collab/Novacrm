import Link from "next/link";
import { prisma } from "@novacrm/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AcceptInviteButton } from "@/components/accept-invite-button";
import { AcceptInviteRegisterForm } from "@/components/accept-invite-register-form";

function InvalidInviteCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite not found</CardTitle>
        <CardDescription>This invite link is invalid, has expired, or has already been used.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  const isValid = invite && !invite.acceptedAt && invite.expires > new Date();

  if (!isValid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/20 px-4">
        <div className="w-full max-w-sm">
          <InvalidInviteCard />
        </div>
      </div>
    );
  }

  const session = await auth();
  const inviter = await prisma.user.findUnique({
    where: { id: invite.invitedById },
    select: { name: true, email: true },
  });
  const inviterName = inviter?.name ?? inviter?.email ?? "A teammate";

  let content: React.ReactNode;

  if (session?.user?.email) {
    if (session.user.email.toLowerCase() === invite.email.toLowerCase()) {
      content = (
        <Card>
          <CardHeader>
            <CardTitle>Join {invite.organization.name}</CardTitle>
            <CardDescription>
              {inviterName} invited you as a{" "}
              <span className="font-medium text-foreground">{invite.role.toLowerCase()}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AcceptInviteButton token={token} />
          </CardContent>
        </Card>
      );
    } else {
      content = (
        <Card>
          <CardHeader>
            <CardTitle>Wrong account</CardTitle>
            <CardDescription>
              This invite was sent to {invite.email}, but you&apos;re signed in as{" "}
              {session.user.email}. Log out and try again with the invited email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              nativeButton={false}
              render={<Link href={`/login?callbackUrl=/invite/${token}`} />}
            >
              Switch account
            </Button>
          </CardContent>
        </Card>
      );
    }
  } else {
    const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });

    if (existingUser) {
      content = (
        <Card>
          <CardHeader>
            <CardTitle>Join {invite.organization.name}</CardTitle>
            <CardDescription>
              {inviterName} invited you to join. Log in with {invite.email} to accept.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              nativeButton={false}
              render={<Link href={`/login?callbackUrl=/invite/${token}`} />}
            >
              Log in to accept
            </Button>
          </CardContent>
        </Card>
      );
    } else {
      content = (
        <Card>
          <CardHeader>
            <CardTitle>Join {invite.organization.name}</CardTitle>
            <CardDescription>
              {inviterName} invited you as a{" "}
              <span className="font-medium text-foreground">{invite.role.toLowerCase()}</span>. Create
              an account to accept.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AcceptInviteRegisterForm token={token} email={invite.email} />
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/20 px-4">
      <Link href="/" className="mb-4 text-lg font-semibold tracking-tight">
        Valens<span className="text-primary">CRM</span>
      </Link>
      <div className="w-full max-w-sm">{content}</div>
    </div>
  );
}
