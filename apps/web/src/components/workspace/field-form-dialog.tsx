"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { FIELD_TYPE_OPTIONS, FIELD_TYPES_WITH_CHOICES, type FieldTypeValue } from "@/lib/field-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import type { CrmField, CrmObject } from "@novacrm/db";

interface FieldFormDialogProps {
  objectId: string;
  organizationId: string;
  relationTargets: CrmObject[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field?: CrmField;
}

export function FieldFormDialog({
  objectId,
  relationTargets,
  open,
  onOpenChange,
  field,
}: FieldFormDialogProps) {
  const isEdit = !!field;
  const [name, setName] = useState(field?.name ?? "");
  const [type, setType] = useState<FieldTypeValue>((field?.type as FieldTypeValue) ?? "TEXT");
  const [isRequired, setIsRequired] = useState(field?.isRequired ?? false);
  const options = (field?.options as { choices?: string[]; targetObjectId?: string } | null) ?? {};
  const [choicesText, setChoicesText] = useState((options.choices ?? []).join(", "));
  const [targetObjectId, setTargetObjectId] = useState(options.targetObjectId ?? relationTargets[0]?.id ?? "");

  const utils = trpc.useUtils();
  const createField = trpc.field.create.useMutation({
    onSuccess: async () => {
      await utils.object.get.invalidate({ objectId });
      reset();
      onOpenChange(false);
    },
  });
  const updateField = trpc.field.update.useMutation({
    onSuccess: async () => {
      await utils.object.get.invalidate({ objectId });
      onOpenChange(false);
    },
  });

  function reset() {
    setName("");
    setType("TEXT");
    setIsRequired(false);
    setChoicesText("");
  }

  function buildOptions(): Record<string, unknown> | undefined {
    if (FIELD_TYPES_WITH_CHOICES.includes(type)) {
      return {
        choices: choicesText
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      };
    }
    if (type === "RELATION") {
      return { targetObjectId };
    }
    return undefined;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEdit && field) {
      updateField.mutate({
        fieldId: field.id,
        name: name.trim(),
        isRequired,
        options: buildOptions(),
      });
    } else {
      createField.mutate({
        objectId,
        name: name.trim(),
        type,
        isRequired,
        options: buildOptions(),
      });
    }
  }

  const isPending = createField.isPending || updateField.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit field" : "New field"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="field-name">Field name</Label>
            <Input
              id="field-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Job Status"
            />
          </div>

          {!isEdit && (
            <div className="grid gap-2">
              <Label>Field type</Label>
              <Select
                value={type}
                onValueChange={(v) => v && setType(v as FieldTypeValue)}
                items={Object.fromEntries(FIELD_TYPE_OPTIONS.map((o) => [o.value, o.label]))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {FIELD_TYPES_WITH_CHOICES.includes(type) && (
            <div className="grid gap-2">
              <Label htmlFor="field-choices">Options (comma-separated)</Label>
              <Input
                id="field-choices"
                value={choicesText}
                onChange={(e) => setChoicesText(e.target.value)}
                placeholder="e.g. New, In progress, Done"
              />
            </div>
          )}

          {type === "RELATION" && !isEdit && (
            <div className="grid gap-2">
              <Label>Link to</Label>
              <Select
                value={targetObjectId}
                onValueChange={(v) => v && setTargetObjectId(v)}
                items={Object.fromEntries(relationTargets.map((o) => [o.id, o.name]))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an object" />
                </SelectTrigger>
                <SelectContent>
                  {relationTargets.map((obj) => (
                    <SelectItem key={obj.id} value={obj.id}>
                      {obj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="field-required">Required</Label>
            <Switch id="field-required" checked={isRequired} onCheckedChange={setIsRequired} />
          </div>

          {(createField.error ?? updateField.error) && (
            <p className="text-sm text-destructive">
              {(createField.error ?? updateField.error)?.message}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Add field"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
