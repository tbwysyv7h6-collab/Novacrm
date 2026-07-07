"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const EVENT_OPTIONS = [
  { value: "record.created", label: "Record created" },
  { value: "record.updated", label: "Record updated" },
] as const;

function AddWebhookDialog({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["record.created"]);

  const utils = trpc.useUtils();
  const createWebhook = trpc.webhook.create.useMutation({
    onSuccess: async () => {
      await utils.webhook.list.invalidate({ organizationId });
      setOpen(false);
      setUrl("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-3.5" />
        Add webhook
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New webhook</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim() && events.length > 0) {
              createWebhook.mutate({ organizationId, url: url.trim(), events: events as never });
            }
          }}
          className="space-y-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="webhook-url">Endpoint URL</Label>
            <Input
              id="webhook-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-app.com/webhook"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label>Events</Label>
            {EVENT_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={events.includes(opt.value)}
                  onChange={(e) =>
                    setEvents(
                      e.target.checked
                        ? [...events, opt.value]
                        : events.filter((ev) => ev !== opt.value),
                    )
                  }
                  className="size-4 accent-primary"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {createWebhook.error && (
            <p className="text-sm text-destructive">{createWebhook.error.message}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!url.trim() || events.length === 0 || createWebhook.isPending}>
              {createWebhook.isPending ? "Adding..." : "Add webhook"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function WebhooksPanel({ organizationId }: { organizationId: string }) {
  const { data: webhooks = [] } = trpc.webhook.list.useQuery({ organizationId });
  const utils = trpc.useUtils();
  const toggleWebhook = trpc.webhook.toggle.useMutation({
    onSuccess: () => utils.webhook.list.invalidate({ organizationId }),
  });
  const deleteWebhook = trpc.webhook.delete.useMutation({
    onSuccess: () => utils.webhook.list.invalidate({ organizationId }),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Send a signed HTTP POST to your own endpoint whenever a record changes.
          </p>
        </div>
        <AddWebhookDialog organizationId={organizationId} />
      </div>

      {webhooks.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">No webhooks yet.</Card>
      ) : (
        <div className="space-y-2">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{webhook.url}</p>
                  <p className="text-xs text-muted-foreground">{webhook.events.join(", ")}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Switch
                    checked={webhook.isActive}
                    onCheckedChange={(checked) =>
                      toggleWebhook.mutate({ webhookId: webhook.id, isActive: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete webhook"
                    onClick={() => deleteWebhook.mutate({ webhookId: webhook.id })}
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
