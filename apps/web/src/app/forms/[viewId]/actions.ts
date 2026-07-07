"use server";

import { headers } from "next/headers";
import { prisma, type Prisma, type CrmField } from "@novacrm/db";
import { runAutomations } from "@/server/automations/run";
import { checkRecordQuota } from "@/server/record-quota";
import { dispatchWebhooks } from "@/server/webhooks/dispatch";
import { checkRateLimit } from "@/server/rate-limit";
import { isPublicFormField } from "@/lib/public-form";

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

function parseValue(field: CrmField, formData: FormData): unknown {
  if (field.type === "BOOLEAN") return formData.get(field.apiName) === "on";
  if (field.type === "MULTI_SELECT") return formData.getAll(field.apiName);
  if (field.type === "NUMBER" || field.type === "CURRENCY") {
    const raw = formData.get(field.apiName);
    return raw ? Number(raw) : null;
  }
  const raw = formData.get(field.apiName);
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

export async function submitPublicForm(
  viewId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`public-form:${viewId}:${ip}`, 20, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { ok: false, error: "Too many submissions. Please try again later." };
  }

  const view = await prisma.crmView.findUnique({
    where: { id: viewId },
    include: { object: { include: { fields: true } } },
  });

  if (!view || view.type !== "FORM") {
    return { ok: false, error: "This form is no longer available." };
  }

  const quota = await checkRecordQuota(view.object);
  if (!quota.allowed) {
    return { ok: false, error: quota.message ?? "This form is temporarily unavailable." };
  }

  const publicFields = view.object.fields.filter(isPublicFormField);
  const data: Record<string, unknown> = {};

  for (const field of publicFields) {
    const value = parseValue(field, formData);
    if (field.isRequired && (value === null || value === "")) {
      return { ok: false, error: `${field.name} is required.` };
    }
    if (value !== null) data[field.apiName] = value;
  }

  const record = await prisma.crmRecord.create({
    data: {
      objectId: view.objectId,
      organizationId: view.object.organizationId,
      data: data as Prisma.InputJsonValue,
    },
  });

  await runAutomations({ event: "RECORD_CREATED", record, object: view.object });
  await dispatchWebhooks(view.object.organizationId, "record.created", record);

  return { ok: true };
}
