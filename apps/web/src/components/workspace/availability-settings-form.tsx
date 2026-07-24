"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { PlanTier, AvailabilityRule } from "@novacrm/db";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DayRule = { enabled: boolean; startTime: string; endTime: string };

export function AvailabilitySettingsForm({
  organizationId,
  organization,
}: {
  organizationId: string;
  organization: { plan: PlanTier; appointmentDurationMinutes: number; bookingWindowDays: number };
}) {
  const { data: rules } = trpc.appointment.listAvailabilityRules.useQuery({ organizationId });

  if (!rules) {
    return <Card className="p-10 text-center text-muted-foreground">Loading...</Card>;
  }

  return (
    <AvailabilitySettingsFormInner
      organizationId={organizationId}
      organization={organization}
      rules={rules}
    />
  );
}

function AvailabilitySettingsFormInner({
  organizationId,
  organization,
  rules,
}: {
  organizationId: string;
  organization: { plan: PlanTier; appointmentDurationMinutes: number; bookingWindowDays: number };
  rules: AvailabilityRule[];
}) {
  const utils = trpc.useUtils();
  const { data: blocks = [] } = trpc.appointment.listAvailabilityBlocks.useQuery({ organizationId });

  const [days, setDays] = useState<DayRule[]>(() =>
    DAY_LABELS.map((_, dayOfWeek) => {
      const rule = rules.find((r) => r.dayOfWeek === dayOfWeek);
      return rule
        ? { enabled: true, startTime: rule.startTime, endTime: rule.endTime }
        : { enabled: false, startTime: "09:00", endTime: "17:00" };
    }),
  );
  const [duration, setDuration] = useState(organization.appointmentDurationMinutes);
  const [windowDays, setWindowDays] = useState(organization.bookingWindowDays);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [saved, setSaved] = useState(false);

  const saveRules = trpc.appointment.setAvailabilityRules.useMutation({
    onSuccess: () => {
      utils.appointment.listAvailabilityRules.invalidate({ organizationId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });
  const saveSettings = trpc.appointment.updateBookingSettings.useMutation();
  const addBlock = trpc.appointment.addAvailabilityBlock.useMutation({
    onSuccess: () => {
      utils.appointment.listAvailabilityBlocks.invalidate({ organizationId });
      setNewBlockDate("");
    },
  });
  const removeBlock = trpc.appointment.removeAvailabilityBlock.useMutation({
    onSuccess: () => utils.appointment.listAvailabilityBlocks.invalidate({ organizationId }),
  });

  function updateDay(index: number, patch: Partial<DayRule>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function handleSave() {
    const activeRules = days
      .map((day, dayOfWeek) => ({ ...day, dayOfWeek }))
      .filter((day) => day.enabled)
      .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));
    saveRules.mutate({ organizationId, rules: activeRules });
    saveSettings.mutate({ organizationId, appointmentDurationMinutes: duration, bookingWindowDays: windowDays });
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="mb-4 font-medium">Weekly hours</h3>
        <div className="space-y-3">
          {DAY_LABELS.map((label, i) => (
            <div key={label} className="flex flex-wrap items-center gap-3">
              <Switch
                checked={days[i].enabled}
                onCheckedChange={(checked) => updateDay(i, { enabled: checked })}
              />
              <span className="w-24 text-sm">{label}</span>
              {days[i].enabled ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={days[i].startTime}
                    onChange={(e) => updateDay(i, { startTime: e.target.value })}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={days[i].endTime}
                    onChange={(e) => updateDay(i, { endTime: e.target.value })}
                    className="w-32"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Closed</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="duration">Appointment length (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min={5}
            max={480}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="window">How far ahead customers can book (days)</Label>
          <Input
            id="window"
            type="number"
            min={1}
            max={90}
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
          />
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saveRules.isPending || saveSettings.isPending}>
        {saveRules.isPending || saveSettings.isPending ? "Saving..." : saved ? "Saved" : "Save changes"}
      </Button>

      <Card className="p-5">
        <h3 className="mb-4 font-medium">Blocked dates</h3>
        <div className="mb-4 flex gap-2">
          <Input
            type="date"
            value={newBlockDate}
            onChange={(e) => setNewBlockDate(e.target.value)}
            className="max-w-48"
          />
          <Button
            type="button"
            variant="outline"
            disabled={!newBlockDate || addBlock.isPending}
            onClick={() =>
              addBlock.mutate({ organizationId, date: new Date(newBlockDate).toISOString() })
            }
          >
            Add
          </Button>
        </div>
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blocked dates.</p>
        ) : (
          <ul className="space-y-1.5">
            {blocks.map((block) => (
              <li key={block.id} className="flex items-center justify-between text-sm">
                <span>
                  {new Date(block.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {block.reason ? ` — ${block.reason}` : ""}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeBlock.mutate({ blockId: block.id })}
                  aria-label="Remove blocked date"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
