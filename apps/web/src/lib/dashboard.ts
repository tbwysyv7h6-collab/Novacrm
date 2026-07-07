import type { CrmField, CrmObject, CrmRecord } from "@novacrm/db";

type RecordData = Record<string, unknown>;
type ObjectWithFields = CrmObject & { fields: CrmField[] };

export interface RecordsPerObject {
  name: string;
  count: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface StageDistribution {
  objectName: string;
  fieldName: string;
  stages: { stage: string; count: number }[];
}

export function computeRecordsPerObject(
  objects: ObjectWithFields[],
  records: CrmRecord[],
): RecordsPerObject[] {
  const counts = new Map<string, number>();
  for (const record of records) counts.set(record.objectId, (counts.get(record.objectId) ?? 0) + 1);
  return objects.map((o) => ({ name: o.name, count: counts.get(o.id) ?? 0 }));
}

export function computeTotalRevenue(objects: ObjectWithFields[], records: CrmRecord[]): number {
  const currencyFieldsByObject = new Map<string, string[]>();
  for (const object of objects) {
    const apiNames = object.fields.filter((f) => f.type === "CURRENCY").map((f) => f.apiName);
    if (apiNames.length > 0) currencyFieldsByObject.set(object.id, apiNames);
  }

  let total = 0;
  for (const record of records) {
    const apiNames = currencyFieldsByObject.get(record.objectId);
    if (!apiNames) continue;
    const data = record.data as RecordData;
    for (const apiName of apiNames) {
      const value = data[apiName];
      if (typeof value === "number") total += value;
    }
  }
  return total;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function computeRecordsCreatedByDay(records: CrmRecord[], days: number): DailyCount[] {
  const counts = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    counts.set(localDateKey(day), 0);
  }

  for (const record of records) {
    const key = localDateKey(record.createdAt);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

export function computeStageDistribution(
  objects: ObjectWithFields[],
  records: CrmRecord[],
): StageDistribution | null {
  for (const object of objects) {
    const statusField =
      object.fields.find((f) => f.type === "SELECT" && /status|stage/i.test(f.apiName)) ??
      object.fields.find((f) => f.type === "SELECT");
    if (!statusField) continue;

    const choices =
      (statusField.options as { choices?: string[] } | null)?.choices ?? [];
    const objectRecords = records.filter((r) => r.objectId === object.id);
    if (objectRecords.length === 0) continue;

    const counts = new Map<string, number>(choices.map((c) => [c, 0]));
    for (const record of objectRecords) {
      const value = (record.data as RecordData)[statusField.apiName];
      if (typeof value === "string") counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    return {
      objectName: object.name,
      fieldName: statusField.name,
      stages: Array.from(counts.entries()).map(([stage, count]) => ({ stage, count })),
    };
  }
  return null;
}

export function computeRecordsInLastDays(records: CrmRecord[], days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return records.filter((r) => r.createdAt >= cutoff).length;
}
