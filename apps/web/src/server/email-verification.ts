import crypto from "node:crypto";
import { prisma } from "@novacrm/db";
import { sendVerificationEmail } from "@/lib/mail";

export async function issueVerificationEmail(email: string, baseUrl: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  const verifyUrl = new URL("/verify-email", baseUrl);
  verifyUrl.searchParams.set("token", token);
  verifyUrl.searchParams.set("email", email);
  await sendVerificationEmail(email, verifyUrl.toString());
}
