import { describe, expect, it } from "vitest";
import type { CrmField, CrmObject, CrmRecord } from "@novacrm/db";
import {
  computeRecordsPerObject,
  computeTotalRevenue,
  computeRecordsCreatedByDay,
  computeStageDistribution,
  computeRecordsInLastDays,
} from "./dashboard";

function makeObject(overrides: Partial<CrmObject & { fields: CrmField[] }>): CrmObject & {
  fields: CrmField[];
} {
  return {
    id: "obj-1",
    organizationId: "org-1",
    name: "Jobs",
    apiName: "jobs",
    icon: null,
    description: null,
    isSystem: false,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    fields: [],
    ...overrides,
  };
}

function makeField(overrides: Partial<CrmField>): CrmField {
  return {
    id: "field-1",
    objectId: "obj-1",
    name: "Price",
    apiName: "price",
    type: "CURRENCY",
    options: null,
    isRequired: false,
    defaultValue: null,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeRecord(overrides: Partial<CrmRecord>): CrmRecord {
  return {
    id: "rec-1",
    objectId: "obj-1",
    organizationId: "org-1",
    data: {},
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("computeRecordsPerObject", () => {
  it("counts records grouped by object, including objects with zero records", () => {
    const objects = [makeObject({ id: "obj-1", name: "Jobs" }), makeObject({ id: "obj-2", name: "Invoices" })];
    const records = [
      makeRecord({ id: "r1", objectId: "obj-1" }),
      makeRecord({ id: "r2", objectId: "obj-1" }),
    ];
    expect(computeRecordsPerObject(objects, records)).toEqual([
      { name: "Jobs", count: 2 },
      { name: "Invoices", count: 0 },
    ]);
  });
});

describe("computeTotalRevenue", () => {
  it("sums CURRENCY fields across records", () => {
    const objects = [
      makeObject({
        id: "obj-1",
        fields: [makeField({ apiName: "price", type: "CURRENCY" })],
      }),
    ];
    const records = [
      makeRecord({ objectId: "obj-1", data: { price: 150 } }),
      makeRecord({ objectId: "obj-1", data: { price: 300 } }),
    ];
    expect(computeTotalRevenue(objects, records)).toBe(450);
  });

  it("ignores non-numeric or missing currency values", () => {
    const objects = [
      makeObject({ id: "obj-1", fields: [makeField({ apiName: "price", type: "CURRENCY" })] }),
    ];
    const records = [
      makeRecord({ objectId: "obj-1", data: { price: "not a number" } }),
      makeRecord({ objectId: "obj-1", data: {} }),
    ];
    expect(computeTotalRevenue(objects, records)).toBe(0);
  });

  it("returns 0 when no object has a currency field", () => {
    const objects = [makeObject({ id: "obj-1", fields: [makeField({ type: "TEXT" })] })];
    const records = [makeRecord({ objectId: "obj-1", data: { price: 500 } })];
    expect(computeTotalRevenue(objects, records)).toBe(0);
  });
});

describe("computeRecordsCreatedByDay", () => {
  it("buckets records by local calendar day and fills empty days with zero", () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const records = [
      makeRecord({ createdAt: today }),
      makeRecord({ createdAt: today }),
      makeRecord({ createdAt: yesterday }),
    ];

    const result = computeRecordsCreatedByDay(records, 3);
    expect(result).toHaveLength(3);
    expect(result.at(-1)?.count).toBe(2); // today
    expect(result.at(-2)?.count).toBe(1); // yesterday
    expect(result.at(-3)?.count).toBe(0); // two days ago
  });

  it("ignores records outside the requested window", () => {
    const longAgo = new Date();
    longAgo.setDate(longAgo.getDate() - 30);
    const result = computeRecordsCreatedByDay([makeRecord({ createdAt: longAgo })], 7);
    expect(result.reduce((sum, d) => sum + d.count, 0)).toBe(0);
  });
});

describe("computeStageDistribution", () => {
  it("finds the first SELECT field and tallies record values against it", () => {
    const objects = [
      makeObject({
        id: "obj-1",
        name: "Jobs",
        fields: [
          makeField({
            apiName: "status",
            name: "Status",
            type: "SELECT",
            options: { choices: ["New", "Done"] },
          }),
        ],
      }),
    ];
    const records = [
      makeRecord({ objectId: "obj-1", data: { status: "New" } }),
      makeRecord({ objectId: "obj-1", data: { status: "New" } }),
      makeRecord({ objectId: "obj-1", data: { status: "Done" } }),
    ];

    expect(computeStageDistribution(objects, records)).toEqual({
      objectName: "Jobs",
      fieldName: "Status",
      stages: [
        { stage: "New", count: 2 },
        { stage: "Done", count: 1 },
      ],
    });
  });

  it("returns null when no object has records against a select field", () => {
    const objects = [makeObject({ fields: [makeField({ type: "TEXT" })] })];
    expect(computeStageDistribution(objects, [makeRecord({})])).toBeNull();
  });
});

describe("computeRecordsInLastDays", () => {
  it("counts only records created within the window", () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const old = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const records = [makeRecord({ createdAt: recent }), makeRecord({ createdAt: old })];
    expect(computeRecordsInLastDays(records, 7)).toBe(1);
  });
});
