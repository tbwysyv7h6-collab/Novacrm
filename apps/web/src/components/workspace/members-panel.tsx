"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Mail, Trash2, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Membership, OrganizationInvite, PlanTier, User } from "@novacrm/db";

type AssignableRole = "ADMIN" | "MEMBER" | "VIEWER";

const ASSIGNABLE_ROLES: { value: AssignableRole; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "MEMBER", label: "Member" },
  { value: "VIEWER", label: "Viewer" },
];

type MemberWithUser = Membership & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

function InviteForm({ organizationId }: { organizationId: string }) {
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const inviteMember = trpc.organization.inviteMember.useMutation({
    onSuccess: () => {
      utils.organization.listInvites.invalidate({ organizationId });
      setEmail("");
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    },
    onError: (err) => setError(err.message),
  });

  return (
    <Card className="p-4">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          inviteMember.mutate({ organizationId, email, role });
        }}
      >
        <div className="grid min-w-48 flex-1 gap-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Role</Label>
          <Select
            value={role}
            onValueChange={(v) => v && setRole(v as AssignableRole)}
            items={Object.fromEntries(ASSIGNABLE_ROLES.map((r) => [r.value, r.label]))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNABLE_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={inviteMember.isPending}>
          {inviteMember.isPending ? "Sending..." : sent ? "Sent!" : "Send invite"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </Card>
  );
}

function PendingInvites({
  organizationId,
  invites,
}: {
  organizationId: string;
  invites: OrganizationInvite[];
}) {
  const utils = trpc.useUtils();
  const revokeInvite = trpc.organization.revokeInvite.useMutation({
    onSuccess: () => utils.organization.listInvites.invalidate({ organizationId }),
  });

  if (invites.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Pending invites</p>
      {invites.map((invite) => (
        <Card key={invite.id}>
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{invite.email}</p>
                <p className="text-xs text-muted-foreground">Invited as {invite.role.toLowerCase()}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => revokeInvite.mutate({ inviteId: invite.id })}
              aria-label="Revoke invite"
            >
              <X className="size-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MemberRow({
  organizationId,
  member,
  isAdmin,
  isLastOwner,
}: {
  organizationId: string;
  member: MemberWithUser;
  isAdmin: boolean;
  isLastOwner: boolean;
}) {
  const utils = trpc.useUtils();
  const updateRole = trpc.organization.updateMemberRole.useMutation({
    onSuccess: () => utils.organization.members.invalidate({ organizationId }),
  });
  const removeMember = trpc.organization.removeMember.useMutation({
    onSuccess: () => utils.organization.members.invalidate({ organizationId }),
  });

  const canManage = isAdmin && member.role !== "OWNER";

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3">
        <div>
          <p className="text-sm font-medium">{member.user.name ?? member.user.email}</p>
          <p className="text-xs text-muted-foreground">{member.user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage ? (
            <Select
              value={member.role}
              onValueChange={(v) =>
                v && updateRole.mutate({ membershipId: member.id, role: v as AssignableRole })
              }
              items={Object.fromEntries(ASSIGNABLE_ROLES.map((r) => [r.value, r.label]))}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline">{member.role}</Badge>
          )}
          {canManage && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeMember.mutate({ membershipId: member.id })}
              disabled={isLastOwner}
              aria-label="Remove member"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MembersPanel({
  organizationId,
  plan,
  isAdmin,
  members: initialMembers,
  invites: initialInvites,
}: {
  organizationId: string;
  plan: PlanTier;
  isAdmin: boolean;
  members: MemberWithUser[];
  invites: OrganizationInvite[];
}) {
  const isProOrAbove = plan === "PRO" || plan === "BUSINESS" || plan === "ENTERPRISE";

  const { data: members = initialMembers } = trpc.organization.members.useQuery(
    { organizationId },
    { initialData: initialMembers },
  );
  const { data: invites = initialInvites } = trpc.organization.listInvites.useQuery(
    { organizationId },
    { initialData: initialInvites, enabled: isAdmin && isProOrAbove },
  );
  const ownerCount = members.filter((m) => m.role === "OWNER").length;

  return (
    <div className="max-w-lg space-y-4">
      {isAdmin && !isProOrAbove && (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <Lock className="size-6 text-muted-foreground" />
          <div>
            <p className="font-medium">Inviting teammates is a Pro feature</p>
            <p className="text-sm text-muted-foreground">
              Upgrade to Pro or above to add people to this workspace.
            </p>
          </div>
          <Button nativeButton={false} render={<Link href={`/app/${organizationId}/settings/billing`} />}>
            Upgrade to Pro
          </Button>
        </Card>
      )}

      {isAdmin && isProOrAbove && (
        <>
          <InviteForm organizationId={organizationId} />
          <PendingInvites organizationId={organizationId} invites={invites} />
        </>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Members</p>
        {members.map((member) => (
          <MemberRow
            key={member.id}
            organizationId={organizationId}
            member={member}
            isAdmin={isAdmin}
            isLastOwner={member.role === "OWNER" && ownerCount <= 1}
          />
        ))}
      </div>
    </div>
  );
}
