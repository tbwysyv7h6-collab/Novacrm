import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { issueVerificationEmail } from "@/server/email-verification";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  await issueVerificationEmail(session.user.email, request.url);
  return NextResponse.json({ ok: true });
}
