import { prisma, type CrmObject, type CrmRecord, type Prisma } from "@novacrm/db";
import { sendAutomationEmail } from "@/lib/mail";

type AutomationEvent = "RECORD_CREATED" | "RECORD_UPDATED";

interface RunAutomationsParams {
  event: AutomationEvent;
  record: CrmRecord;
  object: CrmObject;
  previous?: CrmRecord;
}

interface AutomationCondition {
  fieldApiName: string;
  operator: "equals" | "not_equals" | "changed";
  value?: unknown;
}

export interface AutomationAction {
  type: "SEND_EMAIL" | "CREATE_TASK" | "UPDATE_FIELD" | "ASSIGN_USER" | "SEND_REMINDER";
  config: Record<string, unknown>;
}

function matchesConditions(
  conditions: AutomationCondition[] | null | undefined,
  record: CrmRecord,
  previous?: CrmRecord,
) {
  if (!conditions || conditions.length === 0) return true;
  const data = record.data as Record<string, unknown>;
  const prevData = previous?.data as Record<string, unknown> | undefined;

  return conditions.every((cond) => {
    if (cond.operator === "changed") {
      return prevData ? data[cond.fieldApiName] !== prevData[cond.fieldApiName] : true;
    }
    if (cond.operator === "equals") return data[cond.fieldApiName] === cond.value;
    if (cond.operator === "not_equals") return data[cond.fieldApiName] !== cond.value;
    return true;
  });
}

function interpolate(template: string, record: CrmRecord): string {
  const data = record.data as Record<string, unknown>;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(data[key] ?? ""));
}

async function runAction(action: AutomationAction, record: CrmRecord, object: CrmObject) {
  const { config } = action;

  switch (action.type) {
    case "SEND_EMAIL": {
      const to = typeof config.to === "string" ? config.to : undefined;
      const subject = typeof config.subject === "string" ? config.subject : "Notification from ValensCRM";
      const body = typeof config.body === "string" ? config.body : "";
      if (to) await sendAutomationEmail(to, interpolate(subject, record), interpolate(body, record));
      break;
    }
    case "CREATE_TASK": {
      const taskObjectId = typeof config.taskObjectId === "string" ? config.taskObjectId : undefined;
      if (!taskObjectId) break;
      const title =
        typeof config.titleTemplate === "string" ? interpolate(config.titleTemplate, record) : "New task";
      const dueInDays = typeof config.dueInDays === "number" ? config.dueInDays : undefined;
      const dueAt =
        dueInDays !== undefined ? new Date(Date.now() + dueInDays * 86_400_000).toISOString() : undefined;
      await prisma.crmRecord.create({
        data: {
          objectId: taskObjectId,
          organizationId: object.organizationId,
          data: {
            name: title,
            ...(dueAt && { due_date: dueAt }),
            related_record_id: record.id,
          } as Prisma.InputJsonValue,
        },
      });
      break;
    }
    case "UPDATE_FIELD": {
      const fieldApiName = typeof config.fieldApiName === "string" ? config.fieldApiName : undefined;
      if (!fieldApiName) break;
      await prisma.crmRecord.update({
        where: { id: record.id },
        data: {
          data: { ...(record.data as object), [fieldApiName]: config.value } as Prisma.InputJsonValue,
        },
      });
      break;
    }
    case "ASSIGN_USER": {
      const fieldApiName = typeof config.fieldApiName === "string" ? config.fieldApiName : undefined;
      const userId = typeof config.userId === "string" ? config.userId : undefined;
      if (!fieldApiName || !userId) break;
      await prisma.crmRecord.update({
        where: { id: record.id },
        data: {
          data: { ...(record.data as object), [fieldApiName]: userId } as Prisma.InputJsonValue,
        },
      });
      break;
    }
    case "SEND_REMINDER": {
      const message = typeof config.message === "string" ? interpolate(config.message, record) : "Reminder";
      console.log(`[reminder] ${message} (record ${record.id})`);
      break;
    }
  }
}

export async function runAutomations({ event, record, object, previous }: RunAutomationsParams) {
  const automations = await prisma.crmAutomation.findMany({
    where: { objectId: object.id, trigger: event, isActive: true },
  });

  for (const automation of automations) {
    if (!matchesConditions(automation.conditions as AutomationCondition[] | null, record, previous)) {
      continue;
    }
    const actions = (automation.actions as unknown as AutomationAction[]) ?? [];
    for (const action of actions) {
      await runAction(action, record, object);
    }
  }
}
