"use client";

import { useState } from "react";
import { Plus, Trash2, Workflow, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
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
import type { CrmObject } from "@novacrm/db";
import type { AutomationAction } from "@/server/automations/run";

const ACTION_TYPES = [
  { value: "SEND_EMAIL", label: "Send email" },
  { value: "CREATE_TASK", label: "Create task" },
  { value: "UPDATE_FIELD", label: "Update a field" },
  { value: "ASSIGN_USER", label: "Assign a team member" },
  { value: "SEND_REMINDER", label: "Schedule a reminder" },
] as const;

function emptyAction(type: AutomationAction["type"]): AutomationAction {
  return { type, config: {} };
}

function ActionEditor({
  action,
  objects,
  onChange,
  onRemove,
}: {
  action: AutomationAction;
  objects: CrmObject[];
  onChange: (action: AutomationAction) => void;
  onRemove: () => void;
}) {
  function setConfig(patch: Record<string, unknown>) {
    onChange({ ...action, config: { ...action.config, ...patch } });
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <Select
          value={action.type}
          onValueChange={(v) => v && onChange(emptyAction(v as AutomationAction["type"]))}
          items={Object.fromEntries(ACTION_TYPES.map((o) => [o.value, o.label]))}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove action">
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {action.type === "SEND_EMAIL" && (
        <div className="space-y-2">
          <Input
            placeholder="Send to (email address)"
            value={String(action.config.to ?? "")}
            onChange={(e) => setConfig({ to: e.target.value })}
          />
          <Input
            placeholder="Subject"
            value={String(action.config.subject ?? "")}
            onChange={(e) => setConfig({ subject: e.target.value })}
          />
          <textarea
            placeholder="Body — use {{field_name}} to insert record values"
            value={String(action.config.body ?? "")}
            onChange={(e) => setConfig({ body: e.target.value })}
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
      )}

      {action.type === "CREATE_TASK" && (
        <div className="space-y-2">
          <Select
            value={String(action.config.taskObjectId ?? "")}
            onValueChange={(v) => v && setConfig({ taskObjectId: v })}
            items={Object.fromEntries(objects.map((o) => [o.id, o.name]))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Create a record in..." />
            </SelectTrigger>
            <SelectContent>
              {objects.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Title — use {{field_name}} to insert record values"
            value={String(action.config.titleTemplate ?? "")}
            onChange={(e) => setConfig({ titleTemplate: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Due in (days)"
            value={String(action.config.dueInDays ?? "")}
            onChange={(e) => setConfig({ dueInDays: Number(e.target.value) })}
          />
        </div>
      )}

      {action.type === "UPDATE_FIELD" && (
        <div className="space-y-2">
          <Input
            placeholder="Field key (e.g. status)"
            value={String(action.config.fieldApiName ?? "")}
            onChange={(e) => setConfig({ fieldApiName: e.target.value })}
          />
          <Input
            placeholder="New value"
            value={String(action.config.value ?? "")}
            onChange={(e) => setConfig({ value: e.target.value })}
          />
        </div>
      )}

      {action.type === "ASSIGN_USER" && (
        <div className="space-y-2">
          <Input
            placeholder="Field key (e.g. assigned_to)"
            value={String(action.config.fieldApiName ?? "")}
            onChange={(e) => setConfig({ fieldApiName: e.target.value })}
          />
          <Input
            placeholder="User ID to assign"
            value={String(action.config.userId ?? "")}
            onChange={(e) => setConfig({ userId: e.target.value })}
          />
        </div>
      )}

      {action.type === "SEND_REMINDER" && (
        <Input
          placeholder="Reminder message — use {{field_name}} to insert record values"
          value={String(action.config.message ?? "")}
          onChange={(e) => setConfig({ message: e.target.value })}
        />
      )}
    </Card>
  );
}

function CreateAutomationDialog({
  organizationId,
  objects,
}: {
  organizationId: string;
  objects: CrmObject[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [objectId, setObjectId] = useState(objects[0]?.id ?? "");
  const [trigger, setTrigger] = useState<"RECORD_CREATED" | "RECORD_UPDATED">("RECORD_CREATED");
  const [actions, setActions] = useState<AutomationAction[]>([emptyAction("SEND_EMAIL")]);

  const utils = trpc.useUtils();
  const createAutomation = trpc.automation.create.useMutation({
    onSuccess: async () => {
      await utils.automation.list.invalidate({ organizationId });
      setOpen(false);
      setName("");
      setActions([emptyAction("SEND_EMAIL")]);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !objectId) return;
    createAutomation.mutate({ objectId, name: name.trim(), trigger, actions });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New automation
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New automation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="automation-name">Name</Label>
            <Input
              id="automation-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New lead follow-up"
            />
          </div>

          <div className="rounded-lg border p-3">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              If
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={objectId}
                onValueChange={(v) => v && setObjectId(v)}
                items={Object.fromEntries(objects.map((o) => [o.id, o.name]))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Object" />
                </SelectTrigger>
                <SelectContent>
                  {objects.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={trigger}
                onValueChange={(v) => v && setTrigger(v as typeof trigger)}
                items={{ RECORD_CREATED: "is created", RECORD_UPDATED: "is updated" }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECORD_CREATED">is created</SelectItem>
                  <SelectItem value="RECORD_UPDATED">is updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Then
            </p>
            <div className="space-y-3">
              {actions.map((action, i) => (
                <ActionEditor
                  key={i}
                  action={action}
                  objects={objects}
                  onChange={(next) => setActions(actions.map((a, idx) => (idx === i ? next : a)))}
                  onRemove={() => setActions(actions.filter((_, idx) => idx !== i))}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setActions([...actions, emptyAction("SEND_EMAIL")])}
            >
              <Plus className="size-3.5" />
              Add action
            </Button>
          </div>

          {createAutomation.error && (
            <p className="text-sm text-destructive">{createAutomation.error.message}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || !objectId || createAutomation.isPending}>
              {createAutomation.isPending ? "Saving..." : "Create automation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AutomationsPanel({
  organizationId,
  objects,
}: {
  organizationId: string;
  objects: CrmObject[];
}) {
  const { data: automations = [] } = trpc.automation.list.useQuery({ organizationId });
  const utils = trpc.useUtils();
  const toggleAutomation = trpc.automation.toggle.useMutation({
    onSuccess: () => utils.automation.list.invalidate({ organizationId }),
  });
  const deleteAutomation = trpc.automation.delete.useMutation({
    onSuccess: () => utils.automation.list.invalidate({ organizationId }),
  });

  if (objects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Create an object first (e.g. Contacts, Jobs) before building automations.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateAutomationDialog organizationId={organizationId} objects={objects} />
      </div>

      {automations.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Workflow className="mx-auto mb-3 size-6" />
          No automations yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map((automation) => (
            <Card key={automation.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{automation.name}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {automation.object.name}
                    <ArrowRight className="size-3" />
                    {automation.trigger === "RECORD_CREATED" ? "is created" : "is updated"}
                    <span className="mx-1">·</span>
                    {(automation.actions as unknown as AutomationAction[]).length} action
                    {(automation.actions as unknown as AutomationAction[]).length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={automation.isActive}
                    onCheckedChange={(checked) =>
                      toggleAutomation.mutate({ automationId: automation.id, isActive: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete automation"
                    onClick={() => deleteAutomation.mutate({ automationId: automation.id })}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
