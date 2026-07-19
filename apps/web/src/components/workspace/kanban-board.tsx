"use client";

import { DndContext, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { motion } from "motion/react";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CrmField, CrmObject, CrmRecord, CrmView } from "@novacrm/db";

type RecordData = Record<string, unknown>;

const UNASSIGNED = "__unassigned__";

function KanbanCard({
  record,
  titleField,
  index,
}: {
  record: CrmRecord;
  titleField?: CrmField;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: record.id,
  });
  const data = record.data as RecordData;
  const title = titleField ? String(data[titleField.apiName] ?? "Untitled") : record.id;

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.25) }}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
          : undefined
      }
      className={cn("touch-none", isDragging && "opacity-50")}
    >
      <Card className="cursor-grab p-3 text-sm shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        {title}
      </Card>
    </motion.div>
  );
}

function KanbanColumn({
  id,
  label,
  records,
  titleField,
  index,
}: {
  id: string;
  label: string;
  records: CrmRecord[];
  titleField?: CrmField;
  index: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className={cn(
        "flex w-64 shrink-0 flex-col gap-2 rounded-xl border bg-muted/20 p-3 shadow-sm transition-shadow duration-200",
        isOver && "ring-2 ring-primary/40 shadow-md",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{records.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {records.map((record, i) => (
          <KanbanCard key={record.id} record={record} titleField={titleField} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

export function KanbanBoard({
  object,
  view,
}: {
  object: CrmObject & { fields: CrmField[] };
  view: CrmView;
}) {
  const utils = trpc.useUtils();
  const { data: records = [] } = trpc.record.list.useQuery({ objectId: object.id });
  const updateRecord = trpc.record.update.useMutation({
    onSuccess: () => utils.record.list.invalidate({ objectId: object.id }),
  });

  const config = (view.config as { groupByFieldApiName?: string } | null) ?? {};
  const groupField = object.fields.find((f) => f.apiName === config.groupByFieldApiName);
  const titleField = object.fields.find((f) => f.apiName === "name") ?? object.fields[0];
  const choices = (groupField?.options as { choices?: string[] } | null)?.choices ?? [];

  if (!groupField) {
    return (
      <p className="text-sm text-muted-foreground">
        This view isn&apos;t configured yet — edit it to choose a select field to group by.
      </p>
    );
  }

  const columns = [...choices, UNASSIGNED];

  function recordsFor(choice: string) {
    return records.filter((r) => {
      const value = (r.data as RecordData)[groupField!.apiName];
      return choice === UNASSIGNED ? !value : value === choice;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newValue = over.id === UNASSIGNED ? null : String(over.id);
    updateRecord.mutate({ recordId: String(active.id), data: { [groupField!.apiName]: newValue } });
  }

  return (
    <DndContext id={`kanban-${view.id}`} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((choice, index) => (
          <KanbanColumn
            key={choice}
            id={choice}
            label={choice === UNASSIGNED ? "No status" : choice}
            records={recordsFor(choice)}
            titleField={titleField}
            index={index}
          />
        ))}
      </div>
    </DndContext>
  );
}
