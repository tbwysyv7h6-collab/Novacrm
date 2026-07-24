export type AvailabilityRuleInput = {
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
};

export type AvailabilityBlockInput = {
  date: Date;
};

export type ExistingAppointmentInput = {
  startsAt: Date;
};

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Pure function: given a business's recurring weekly availability, one-off
 * blocked dates, and already-booked slots, returns every open slot start
 * time over the next `windowDays`. No I/O — the caller fetches rules,
 * blocks, and existing appointments from the DB and passes them in.
 */
export function getAvailableSlots(
  rules: AvailabilityRuleInput[],
  blocks: AvailabilityBlockInput[],
  existingAppointments: ExistingAppointmentInput[],
  durationMinutes: number,
  windowDays: number,
  now: Date = new Date(),
): Date[] {
  const bookedTimestamps = new Set(existingAppointments.map((a) => a.startsAt.getTime()));
  const blockedDays = new Set(blocks.map((b) => startOfDay(b.date).getTime()));

  const slots: Date[] = [];

  for (let dayOffset = 0; dayOffset < windowDays; dayOffset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
    if (blockedDays.has(day.getTime())) continue;

    const dayOfWeek = day.getDay();
    const rulesForDay = rules.filter((r) => r.dayOfWeek === dayOfWeek);

    for (const rule of rulesForDay) {
      const startMinutes = parseTimeToMinutes(rule.startTime);
      const endMinutes = parseTimeToMinutes(rule.endTime);

      for (
        let slotMinutes = startMinutes;
        slotMinutes + durationMinutes <= endMinutes;
        slotMinutes += durationMinutes
      ) {
        const slotStart = new Date(day);
        slotStart.setHours(0, slotMinutes, 0, 0);

        if (slotStart <= now) continue;
        if (bookedTimestamps.has(slotStart.getTime())) continue;
        // isSameDay guards against a slot rolling past midnight due to an
        // endTime like "25:00" or similar malformed rule data.
        if (!isSameDay(slotStart, day)) continue;

        slots.push(slotStart);
      }
    }
  }

  return slots.sort((a, b) => a.getTime() - b.getTime());
}
