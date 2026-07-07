"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CrmField, CrmObject, CrmRecord, CrmView } from "@novacrm/db";

type RecordData = Record<string, unknown>;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildMonthGrid(monthDate: Date) {
  const first = startOfMonth(monthDate);
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    return day;
  });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CalendarView({
  object,
  view,
}: {
  object: CrmObject & { fields: CrmField[] };
  view: CrmView;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const { data: records = [] } = trpc.record.list.useQuery({ objectId: object.id });

  const config = (view.config as { dateFieldApiName?: string } | null) ?? {};
  const dateField = object.fields.find((f) => f.apiName === config.dateFieldApiName);
  const titleField = object.fields.find((f) => f.apiName === "name") ?? object.fields[0];

  const recordsByDay = useMemo(() => {
    const map = new Map<string, CrmRecord[]>();
    if (!dateField) return map;
    for (const record of records) {
      const raw = (record.data as RecordData)[dateField.apiName];
      if (typeof raw !== "string") continue;
      const key = raw.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), record]);
    }
    return map;
  }, [records, dateField]);

  if (!dateField) {
    return (
      <p className="text-sm text-muted-foreground">
        This view isn&apos;t configured yet — edit it to choose a date field.
      </p>
    );
  }

  const days = buildMonthGrid(month);
  const todayKey = toDateKey(new Date());

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-xs">
        {WEEKDAYS.map((day) => (
          <div key={day} className="bg-muted/40 px-2 py-1.5 text-center font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const key = toDateKey(day);
          const inMonth = day.getMonth() === month.getMonth();
          const dayRecords = recordsByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={cn(
                "min-h-24 bg-background p-1.5",
                !inMonth && "bg-muted/10 text-muted-foreground",
                key === todayKey && "ring-1 ring-inset ring-primary/50",
              )}
            >
              <div className="mb-1 text-right">{day.getDate()}</div>
              <div className="space-y-1">
                {dayRecords.slice(0, 3).map((record) => (
                  <div
                    key={record.id}
                    className="truncate rounded bg-primary/10 px-1.5 py-0.5 text-primary"
                  >
                    {titleField ? String((record.data as RecordData)[titleField.apiName] ?? "Untitled") : record.id}
                  </div>
                ))}
                {dayRecords.length > 3 && (
                  <div className="text-muted-foreground">+{dayRecords.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
