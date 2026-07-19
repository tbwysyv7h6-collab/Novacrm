"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { sendDemoRequestEmail } from "@/lib/mail";
import { checkRateLimit } from "@/server/rate-limit";

const demoRequestSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  businessName: z.string().trim().min(1).max(100),
  message: z.string().trim().max(1000).optional(),
});

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

export async function submitDemoRequest(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`demo-request:${ip}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { ok: false, error: "Too many requests. Please try again later." };
  }

  const parsed = demoRequestSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    businessName: formData.get("businessName"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { ok: false, error: firstIssue?.message ?? "Please check your details and try again." };
  }

  await sendDemoRequestEmail({
    name: parsed.data.name,
    email: parsed.data.email,
    businessName: parsed.data.businessName,
    message: parsed.data.message || "(no message)",
  });

  return { ok: true };
}
