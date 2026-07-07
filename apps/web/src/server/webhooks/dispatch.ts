import crypto from "node:crypto";
import { prisma, type CrmRecord } from "@novacrm/db";

type WebhookEvent = "record.created" | "record.updated";

function sign(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export async function dispatchWebhooks(
  organizationId: string,
  event: WebhookEvent,
  record: CrmRecord,
) {
  const webhooks = await prisma.webhook.findMany({
    where: { organizationId, isActive: true, events: { has: event } },
  });
  if (webhooks.length === 0) return;

  const payload = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: { id: record.id, objectId: record.objectId, ...(record.data as object) },
  });

  await Promise.all(
    webhooks.map(async (webhook) => {
      try {
        await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-NovaCRM-Signature": sign(webhook.secret, payload),
          },
          body: payload,
          signal: AbortSignal.timeout(5000),
        });
      } catch (error) {
        console.error(`[webhook] Failed to deliver to ${webhook.url}:`, error);
      }
    }),
  );
}
