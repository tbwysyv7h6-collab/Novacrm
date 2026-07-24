"use client";

import { useMemo, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { bookAppointment } from "@/app/book/[orgSlug]/actions";

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function BookingCalendar({
  orgSlug,
  slots,
  durationMinutes,
}: {
  orgSlug: string;
  slots: string[]; // ISO strings
  durationMinutes: number;
}) {
  const slotsByDay = useMemo(() => {
    const groups = new Map<string, Date[]>();
    for (const iso of slots) {
      const date = new Date(iso);
      const dayKey = date.toDateString();
      const list = groups.get(dayKey) ?? [];
      list.push(date);
      groups.set(dayKey, list);
    }
    return Array.from(groups.entries());
  }, [slots]);

  const [activeDay, setActiveDay] = useState(slotsByDay[0]?.[0] ?? null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  if (result?.ok) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <Check className="size-6 text-primary" />
        <p className="font-medium">Booking confirmed!</p>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a confirmation to your email address.
        </p>
      </Card>
    );
  }

  if (slotsByDay.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground">
        No appointment slots are available right now — please check back later.
      </Card>
    );
  }

  const activeDaySlots = slotsByDay.find(([key]) => key === activeDay)?.[1] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {slotsByDay.map(([dayKey, daySlots]) => (
          <Button
            key={dayKey}
            type="button"
            variant={activeDay === dayKey ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveDay(dayKey);
              setSelectedSlot(null);
            }}
          >
            {formatDayLabel(daySlots[0])}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {activeDaySlots.map((slot) => (
          <button
            key={slot.toISOString()}
            type="button"
            onClick={() => setSelectedSlot(slot)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
              selectedSlot?.getTime() === slot.getTime()
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {formatTimeLabel(slot)}
          </button>
        ))}
      </div>

      {selectedSlot && (
        <Card className="p-5">
          <p className="mb-4 text-sm text-muted-foreground">
            {formatDayLabel(selectedSlot)} at {formatTimeLabel(selectedSlot)} ({durationMinutes} min)
          </p>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              formData.set("startsAt", selectedSlot.toISOString());
              startTransition(async () => {
                const res = await bookAppointment(orgSlug, formData);
                setResult(res.ok ? { ok: true } : { ok: false, error: res.error });
              });
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="customerName">Your name</Label>
              <Input id="customerName" name="customerName" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input id="customerEmail" name="customerEmail" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerPhone">Phone (optional)</Label>
              <Input id="customerPhone" name="customerPhone" type="tel" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input id="notes" name="notes" />
            </div>
            {result?.error && <p className="text-sm text-destructive">{result.error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Booking..." : "Confirm booking"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
