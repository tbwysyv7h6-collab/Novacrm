import crypto from "node:crypto";
import { prisma, type MembershipRole } from "@novacrm/db";
import { sendInviteEmail } from "@/lib/mail";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function issueInvite(params: {
  organizationId: string;
  organizationName: string;
  email: string;
  role: MembershipRole;
  invitedById: string;
  inviterName: string;
}) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  const invite = await prisma.organizationInvite.upsert({
    where: { organizationId_email: { organizationId: params.organizationId, email: params.email } },
    create: {
      organizationId: params.organizationId,
      email: params.email,
      role: params.role,
      token,
      invitedById: params.invitedById,
      expires,
    },
    update: {
      role: params.role,
      token,
      invitedById: params.invitedById,
      expires,
      acceptedAt: null,
    },
  });

  const inviteUrl = new URL(`/invite/${token}`, siteUrl());
  await sendInviteEmail(params.email, inviteUrl.toString(), params.organizationName, params.inviterName);

  return invite;
}
