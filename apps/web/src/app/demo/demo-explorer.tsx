"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { colorForChoice } from "@/lib/field-colors";
import type { CrmField, CrmObject, CrmRecord, CrmView, Organization } from "@novacrm/db";

type RecordData = Record<string, unknown>;
type ObjectWithDetails = CrmObject & { fields: CrmField[]; views: CrmView[]; records: CrmRecord[] };
type OrganizationWithObjects = Organization & { objects: ObjectWithDetails[] };

const UNASSIGNED = "__unassigned__";

function ReadOnlyValue({
  field,
  value,
  recordNameById,
}: {
  field: CrmField;
  value: unknown;
  recordNameById: Map<string, string>;
}) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground/50">—</span>;
  }

  switch (field.type) {
    case "BOOLEAN":
      return <span>{value ? "Yes" : "No"}</span>;
    case "CURRENCY":
      return <span>£{String(value)}</span>;
    case "DATE":
      return <span>{new Date(String(value)).toLocaleDateString("en-GB")}</span>;
    case "DATETIME":
      return <span>{new Date(String(value)).toLocaleString("en-GB")}</span>;
    case "SELECT":
      return (
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
            colorForChoice(String(value)),
          )}
        >
          {String(value)}
        </span>
      );
    case "MULTI_SELECT":
      return (
        <span className="flex flex-wrap gap-1">
          {(Array.isArray(value) ? value : []).map((v) => (
            <span
              key={String(v)}
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                colorForChoice(String(v)),
              )}
            >
              {String(v)}
            </span>
          ))}
        </span>
      );
    case "RELATION":
      return <span>{recordNameById.get(String(value)) ?? "—"}</span>;
    default:
      return <span>{String(value)}</span>;
  }
}

function ReadOnlyTable({
  object,
  recordNameById,
}: {
  object: ObjectWithDetails;
  recordNameById: Map<string, string>;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {object.fields.map((field) => (
              <th
                key={field.id}
                className="border-b bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground"
              >
                {field.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {object.records.map((record) => {
            const data = record.data as RecordData;
            return (
              <tr key={record.id} className="border-b last:border-0 hover:bg-muted/20">
                {object.fields.map((field) => (
                  <td key={field.id} className="px-3 py-2.5 text-sm">
                    <ReadOnlyValue
                      field={field}
                      value={data[field.apiName]}
                      recordNameById={recordNameById}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReadOnlyKanban({ object, view }: { object: ObjectWithDetails; view: CrmView }) {
  const config = (view.config as { groupByFieldApiName?: string } | null) ?? {};
  const groupField = object.fields.find((f) => f.apiName === config.groupByFieldApiName);
  const titleField = object.fields.find((f) => f.apiName === "name") ?? object.fields[0];
  const choices = (groupField?.options as { choices?: string[] } | null)?.choices ?? [];
  const columns = [...choices, UNASSIGNED];

  function recordsFor(choice: string) {
    return object.records.filter((r) => {
      const value = (r.data as RecordData)[groupField?.apiName ?? ""];
      return choice === UNASSIGNED ? !value : value === choice;
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((choice) => {
        const records = recordsFor(choice);
        if (choice === UNASSIGNED && records.length === 0) return null;
        return (
          <div
            key={choice}
            className="flex w-64 shrink-0 flex-col gap-2 rounded-xl border bg-muted/20 p-3 shadow-sm"
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium">
                {choice === UNASSIGNED ? "No status" : choice}
              </span>
              <span className="text-xs text-muted-foreground">{records.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {records.map((record) => {
                const data = record.data as RecordData;
                const dateField = object.fields.find((f) => f.type === "DATE");
                return (
                  <Card key={record.id} className="p-3 text-sm shadow-sm">
                    <p className="font-medium">
                      {titleField ? String(data[titleField.apiName] ?? "Untitled") : record.id}
                    </p>
                    {dateField && data[dateField.apiName] ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(String(data[dateField.apiName])).toLocaleDateString("en-GB")}
                      </p>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DemoExplorer({ organization }: { organization: OrganizationWithObjects }) {
  const [activeObjectId, setActiveObjectId] = useState<string | undefined>(organization.objects[0]?.id);
  const activeObject = organization.objects.find((o) => o.id === activeObjectId) ?? organization.objects[0];
  const [activeViewId, setActiveViewId] = useState<string | undefined>(activeObject?.views[0]?.id);
  const activeView = activeObject?.views.find((v) => v.id === activeViewId) ?? activeObject?.views[0];

  const recordNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const object of organization.objects) {
      const nameField = object.fields.find((f) => f.apiName === "name");
      for (const record of object.records) {
        const data = record.data as RecordData;
        map.set(record.id, nameField ? String(data[nameField.apiName] ?? record.id) : record.id);
      }
    }
    return map;
  }, [organization.objects]);

  function selectObject(objectId: string) {
    setActiveObjectId(objectId);
    const object = organization.objects.find((o) => o.id === objectId);
    setActiveViewId(object?.views[0]?.id);
  }

  if (!activeObject) return null;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center gap-2 border-b bg-primary/10 px-6 py-3 text-sm">
        <Eye className="size-4 shrink-0 text-primary" />
        <span>
          You&apos;re exploring a live example workspace — nothing here can be edited or saved.
        </span>
        <Button
          size="sm"
          className="ml-auto shrink-0"
          nativeButton={false}
          render={<Link href="/register" />}
        >
          Build your own for free
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-6 py-8">
        <aside className="w-48 shrink-0 space-y-1">
          <p className="mb-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Objects
          </p>
          {organization.objects.map((object) => (
            <button
              key={object.id}
              type="button"
              onClick={() => selectObject(object.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                object.id === activeObject.id
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className="w-4 shrink-0 text-center">{object.icon}</span>
              <span className="truncate">{object.name}</span>
            </button>
          ))}
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-lg">
              {activeObject.icon}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">{activeObject.name}</h1>
          </div>

          {activeObject.views.length > 1 && (
            <Tabs value={activeView?.id} onValueChange={setActiveViewId}>
              <TabsList>
                {activeObject.views.map((view) => (
                  <TabsTrigger key={view.id} value={view.id}>
                    {view.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {activeView?.type === "KANBAN" ? (
            <ReadOnlyKanban object={activeObject} view={activeView} />
          ) : (
            <ReadOnlyTable object={activeObject} recordNameById={recordNameById} />
          )}
        </div>
      </div>
    </main>
  );
}
