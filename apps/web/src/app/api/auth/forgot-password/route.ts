import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import { prisma } from "@novacrm/db";
import { sendPasswordResetEmail } from "@/lib/mail";
import { checkRateLimit } from "@/server/rate-limit";
import { getClientIp } from "@/server/client-ip";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`forgot-password:${getClientIp(request)}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond with the same message so this endpoint can't be used to
  // enumerate which emails have accounts.
  if (user?.passwordHash) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

    const resetUrl = new URL("/reset-password", request.url);
    resetUrl.searchParams.set("token", token);
    resetUrl.searchParams.set("email", email);
    await sendPasswordResetEmail(email, resetUrl.toString());
  }

  return NextResponse.json({ ok: true });
}
