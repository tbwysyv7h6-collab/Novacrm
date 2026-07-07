"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { CrmField } from "@novacrm/db";

const VIEW_TYPES = [
  { value: "TABLE", label: "Table" },
  { value: "KANBAN", label: "Kanban" },
  { value: "CALENDAR", label: "Calendar" },
  { value: "FORM", label: "Form" },
] as const;

type ViewType = (typeof VIEW_TYPES)[number]["value"];

export function AddViewDialog({ objectId, fields }: { objectId: string; fields: CrmField[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ViewType>("TABLE");
  const selectFields = fields.filter((f) => f.type === "SELECT");
  const dateFields = fields.filter((f) => f.type === "DATE" || f.type === "DATETIME");
  const [groupField, setGroupField] = useState(selectFields[0]?.apiName ?? "");
  const [dateField, setDateField] = useState(dateFields[0]?.apiName ?? "");

  const utils = trpc.useUtils();
  const createView = trpc.view.create.useMutation({
    onSuccess: async () => {
      await utils.object.get.invalidate({ objectId });
      setOpen(false);
      setName("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const config: Record<string, unknown> = {};
    if (type === "KANBAN") config.groupByFieldApiName = groupField;
    if (type === "CALENDAR") config.dateFieldApiName = dateField;
    createView.mutate({ objectId, name: name.trim(), type, config });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Add view" />}>
        <Plus className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New view</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="view-name">View name</Label>
            <Input
              id="view-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Board, This month"
            />
          </div>
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => v && setType(v as ViewType)}
              items={Object.fromEntries(VIEW_TYPES.map((o) => [o.value, o.label]))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIEW_TYPES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "KANBAN" &&
            (selectFields.length > 0 ? (
              <div className="grid gap-2">
                <Label>Group by</Label>
                <Select
                  value={groupField}
                  onValueChange={(v) => v && setGroupField(v)}
                  items={Object.fromEntries(selectFields.map((f) => [f.apiName, f.name]))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectFields.map((f) => (
                      <SelectItem key={f.id} value={f.apiName}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add a select field first (e.g. &quot;Status&quot;) to build a Kanban board.
              </p>
            ))}

          {type === "CALENDAR" &&
            (dateFields.length > 0 ? (
              <div className="grid gap-2">
                <Label>Date field</Label>
                <Select
                  value={dateField}
                  onValueChange={(v) => v && setDateField(v)}
                  items={Object.fromEntries(dateFields.map((f) => [f.apiName, f.name]))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFields.map((f) => (
                      <SelectItem key={f.id} value={f.apiName}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add a date field first to build a calendar view.
              </p>
            ))}

          {createView.error && (
            <p className="text-sm text-destructive">{createView.error.message}</p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                !name.trim() ||
                createView.isPending ||
                (type === "KANBAN" && !groupField) ||
                (type === "CALENDAR" && !dateField)
              }
            >
              {createView.isPending ? "Creating..." : "Create view"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
