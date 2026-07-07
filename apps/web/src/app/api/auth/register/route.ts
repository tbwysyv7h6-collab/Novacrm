import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@novacrm/db";
import { slugify, randomSuffix } from "@/lib/slug";
import { issueVerificationEmail } from "@/server/email-verification";
import { checkRateLimit } from "@/server/rate-limit";
import { getClientIp } from "@/server/client-ip";

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
  businessName: z.string().trim().max(100).optional(),
});

async function uniqueOrgSlug(base: string): Promise<string> {
  const root = slugify(base) || "workspace";
  let slug = root;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${root}-${randomSuffix()}`;
  }
  return slug;
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`register:${getClientIp(request)}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Invalid input." },
      { status: 400 },
    );
  }

  const { name, email, password, businessName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const orgName = businessName?.trim() || `${name}'s Workspace`;
  const slug = await uniqueOrgSlug(orgName);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          organization: {
            create: { name: orgName, slug },
          },
        },
      },
    },
  });

  await issueVerificationEmail(email, request.url);

  return NextResponse.json({ ok: true });
}
