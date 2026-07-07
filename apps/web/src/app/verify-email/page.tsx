import Link from "next/link";
import { prisma } from "@novacrm/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function verify(email: string, token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return { ok: false as const };
  }

  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });
  return { ok: true as const };
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;
  const result = token && email ? await verify(email, token) : { ok: false as const };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/20 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{result.ok ? "Email verified" : "Verification failed"}</CardTitle>
          <CardDescription>
            {result.ok
              ? "Your email address has been confirmed."
              : "This verification link is invalid or has expired."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" nativeButton={false} render={<Link href="/app" />}>
            Continue to your CRMs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
