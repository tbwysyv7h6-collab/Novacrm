"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  GripVertical,
  MoreHorizontal,
  Trash2,
  Pencil,
  Type,
  AlignLeft,
  Hash,
  Coins,
  ToggleLeft,
  Calendar,
  CalendarClock,
  Mail,
  Phone,
  Link as LinkIcon,
  CircleDot,
  ListChecks,
  User,
  Link2,
  Paperclip,
  Sigma,
  ListOrdered,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FieldFormDialog } from "@/components/workspace/field-form-dialog";
import { cn } from "@/lib/utils";
import { colorForChoice } from "@/lib/field-colors";
import type { CrmField, CrmObject, CrmRecord, FieldType } from "@novacrm/db";
import type { RouterOutputs } from "@/lib/trpc/types";

type RecordData = Record<string, unknown>;
type ObjectWithDetails = RouterOutputs["object"]["get"];

const FIELD_TYPE_ICONS: Record<FieldType, LucideIcon> = {
  TEXT: Type,
  LONG_TEXT: AlignLeft,
  NUMBER: Hash,
  CURRENCY: Coins,
  BOOLEAN: ToggleLeft,
  DATE: Calendar,
  DATETIME: CalendarClock,
  EMAIL: Mail,
  PHONE: Phone,
  URL: LinkIcon,
  SELECT: CircleDot,
  MULTI_SELECT: ListChecks,
  USER_REF: User,
  RELATION: Link2,
  ATTACHMENT: Paperclip,
  FORMULA: Sigma,
  AUTO_NUMBER: ListOrdered,
};

function EditableCell({
  field,
  record,
  organizationId,
  onChange,
}: {
  field: CrmField;
  record: CrmRecord;
  organizationId: string;
  onChange: (value: unknown) => void;
}) {
  const data = record.data as RecordData;
  const value = data[field.apiName];
  const options = (field.options as { choices?: string[]; targetObjectId?: string } | null) ?? {};

  const membersQuery = trpc.organization.members.useQuery(
    { organizationId },
    { enabled: field.type === "USER_REF" },
  );
  const relationRecords = trpc.record.list.useQuery(
    { objectId: options.targetObjectId ?? "" },
    { enabled: field.type === "RELATION" && !!options.targetObjectId },
  );

  const baseClass =
    "w-full min-w-32 truncate border-none bg-transparent px-2 py-2 text-sm outline-none focus:bg-muted/60 rounded";

  switch (field.type) {
    case "BOOLEAN":
      return (
        <div className="flex justify-center px-2 py-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="size-4 accent-primary"
          />
        </div>
      );
    case "LONG_TEXT":
      return (
        <textarea
          defaultValue={typeof value === "string" ? value : ""}
          onBlur={(e) => onChange(e.target.value)}
          rows={1}
          className={cn(baseClass, "resize-none")}
        />
      );
    case "NUMBER":
      return (
        <input
          type="number"
          defaultValue={typeof value === "number" ? value : ""}
          onBlur={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className={baseClass}
        />
      );
    case "CURRENCY":
      return (
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-sm text-muted-foreground">
            £
          </span>
          <input
            type="number"
            defaultValue={typeof value === "number" ? value : ""}
            onBlur={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            className={cn(baseClass, "pl-5")}
          />
        </div>
      );
    case "DATE":
      return (
        <input
          type="date"
          defaultValue={typeof value === "string" ? value.slice(0, 10) : ""}
          onChange={(e) => onChange(e.target.value || null)}
          className={baseClass}
        />
      );
    case "DATETIME":
      return (
        <input
          type="datetime-local"
          defaultValue={typeof value === "string" ? value.slice(0, 16) : ""}
          onChange={(e) => onChange(e.target.value || null)}
          className={baseClass}
        />
      );
    case "SELECT": {
      const selected = typeof value === "string" ? value : "";
      return (
        <div className="flex px-2 py-2">
          <select
            value={selected}
            onChange={(e) => onChange(e.target.value || null)}
            className={cn(
              "w-fit min-w-16 max-w-full cursor-pointer appearance-none truncate rounded-full border-none text-sm outline-none focus:ring-2 focus:ring-ring/50",
              selected
                ? cn("px-2.5 py-0.5 text-xs font-medium", colorForChoice(selected))
                : "bg-transparent px-1 text-muted-foreground",
            )}
          >
            <option value="" />
            {(options.choices ?? []).map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </div>
      );
    }
    case "MULTI_SELECT":
      return (
        <input
          defaultValue={Array.isArray(value) ? value.join(", ") : ""}
          onBlur={(e) =>
            onChange(
              e.target.value
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean),
            )
          }
          placeholder={(options.choices ?? []).join(", ")}
          className={baseClass}
        />
      );
    case "USER_REF":
      return (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          className={cn(baseClass, "appearance-none")}
        >
          <option value="" />
          {membersQuery.data?.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user.name ?? m.user.email}
            </option>
          ))}
        </select>
      );
    case "RELATION":
      return (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          className={cn(baseClass, "appearance-none")}
        >
          <option value="" />
          {relationRecords.data?.map((r) => (
            <option key={r.id} value={r.id}>
              {String((r.data as RecordData).name ?? r.id)}
            </option>
          ))}
        </select>
      );
    case "FORMULA":
    case "AUTO_NUMBER":
    case "ATTACHMENT":
      return <div className="px-2 py-2 text-sm text-muted-foreground">—</div>;
    default:
      return (
        <input
          defaultValue={typeof value === "string" ? value : ""}
          onBlur={(e) => onChange(e.target.value || null)}
          className={baseClass}
        />
      );
  }
}

function SortableHeaderCell({
  field,
  onEdit,
  onDelete,
}: {
  field: CrmField;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });
  const TypeIcon = FIELD_TYPE_ICONS[field.type] ?? Type;

  return (
    <th
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group sticky top-0 min-w-32 border-b bg-muted/40 px-2 py-2 text-left text-xs font-medium text-muted-foreground",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none opacity-0 group-hover:opacity-100"
          aria-label="Reorder field"
        >
          <GripVertical className="size-3.5" />
        </button>
        <TypeIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
        <span className="flex-1 truncate">
          {field.name}
          {field.isRequired && <span className="text-destructive"> *</span>}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100" />}
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-3.5" />
              Edit field
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-3.5" />
              Delete field
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </th>
  );
}

export function ObjectTable({
  object,
  organizationId,
  relationTargets,
}: {
  object: ObjectWithDetails;
  organizationId: string;
  relationTargets: CrmObject[];
}) {
  const utils = trpc.useUtils();
  const { data: objectData } = trpc.object.get.useQuery(
    { objectId: object.id },
    { initialData: object },
  );
  const fields = objectData.fields;
  const { data: records = [] } = trpc.record.list.useQuery({ objectId: object.id });

  const [editingField, setEditingField] = useState<CrmField | null>(null);
  const [addingField, setAddingField] = useState(false);

  const reorderFields = trpc.field.reorder.useMutation();
  const deleteField = trpc.field.delete.useMutation({
    onSuccess: () => utils.object.get.invalidate({ objectId: object.id }),
  });
  const createRecord = trpc.record.create.useMutation({
    onSuccess: () => utils.record.list.invalidate({ objectId: object.id }),
  });
  const updateRecord = trpc.record.update.useMutation({
    onSuccess: () => utils.record.list.invalidate({ objectId: object.id }),
  });
  const deleteRecord = trpc.record.delete.useMutation({
    onSuccess: () => utils.record.list.invalidate({ objectId: object.id }),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleFieldDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fields, oldIndex, newIndex);
    utils.object.get.setData({ objectId: object.id }, (prev) =>
      prev ? { ...prev, fields: reordered } : prev,
    );
    reorderFields.mutate({ objectId: object.id, fieldIds: reordered.map((f) => f.id) });
  }

  return (
    <div className="overflow-x-auto rounded-xl border shadow-sm">
      <DndContext
        id={`object-fields-dnd-${object.id}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleFieldDragEnd}
      >
      <table className="w-full border-collapse">
        <thead>
            <SortableContext items={fields.map((f) => f.id)} strategy={horizontalListSortingStrategy}>
              <tr>
                {fields.map((field) => (
                  <SortableHeaderCell
                    key={field.id}
                    field={field}
                    onEdit={() => setEditingField(field)}
                    onDelete={() => deleteField.mutate({ fieldId: field.id })}
                  />
                ))}
                <th className="sticky top-0 border-b bg-muted/40 px-2 py-2">
                  <Button variant="ghost" size="icon-xs" onClick={() => setAddingField(true)} aria-label="Add field">
                    <Plus className="size-3.5" />
                  </Button>
                </th>
              </tr>
            </SortableContext>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="group border-b last:border-0 hover:bg-muted/20">
              {fields.map((field) => (
                <td key={field.id} className="border-r last:border-0">
                  <EditableCell
                    field={field}
                    record={record}
                    organizationId={organizationId}
                    onChange={(value) =>
                      updateRecord.mutate({ recordId: record.id, data: { [field.apiName]: value } })
                    }
                  />
                </td>
              ))}
              <td className="px-2">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100"
                  aria-label="Delete row"
                  onClick={() => deleteRecord.mutate({ recordId: record.id })}
                >
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </DndContext>

      {records.length === 0 && (
        <div className="flex flex-col items-center gap-2 border-t px-6 py-10 text-center">
          <LayoutGrid className="size-6 text-muted-foreground/50" />
          <p className="text-sm font-medium">No records yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first {object.name.replace(/s$/, "").toLowerCase() || "record"} to get started.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => createRecord.mutate({ objectId: object.id, data: {} })}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/30",
          records.length > 0 && "border-t",
        )}
      >
        <Plus className="size-3.5" />
        New row
      </button>

      {addingField && (
        <FieldFormDialog
          objectId={object.id}
          organizationId={organizationId}
          relationTargets={relationTargets}
          open={addingField}
          onOpenChange={setAddingField}
        />
      )}
      {editingField && (
        <FieldFormDialog
          objectId={object.id}
          organizationId={organizationId}
          relationTargets={relationTargets}
          field={editingField}
          open={!!editingField}
          onOpenChange={(open) => !open && setEditingField(null)}
        />
      )}
    </div>
  );
}
