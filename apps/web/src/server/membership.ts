import { TRPCError } from "@trpc/server";
import { prisma, type MembershipRole } from "@novacrm/db";

const ROLE_RANK: Record<MembershipRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export async function requireMembership(
  userId: string,
  organizationId: string,
  minRole: MembershipRole = "VIEWER",
) {
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });

  if (!membership || ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this workspace." });
  }

  return membership;
}
