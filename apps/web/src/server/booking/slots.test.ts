import { describe, expect, it } from "vitest";
import { getAvailableSlots } from "./slots";

// Monday 3 August 2026, 00:00 local time — a fixed, deterministic "now".
const MONDAY = new Date(2026, 7, 3);

function at(day: Date, hours: number, minutes = 0): Date {
  const d = new Date(day);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

describe("getAvailableSlots", () => {
  it("generates hourly slots within a single day's rule", () => {
    const slots = getAvailableSlots(
      [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
      [],
      [],
      60,
      1,
      MONDAY,
    );
    expect(slots).toHaveLength(8);
    expect(slots[0]).toEqual(at(MONDAY, 9));
    expect(slots.at(-1)).toEqual(at(MONDAY, 16));
  });

  it("excludes an entire day that's blocked", () => {
    const slots = getAvailableSlots(
      [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
      [{ date: MONDAY }],
      [],
      60,
      1,
      MONDAY,
    );
    expect(slots).toHaveLength(0);
  });

  it("excludes slots already booked", () => {
    const slots = getAvailableSlots(
      [{ dayOfWeek: 1, startTime: "09:00", endTime: "12:00" }],
      [],
      [{ startsAt: at(MONDAY, 10) }],
      60,
      1,
      MONDAY,
    );
    expect(slots).toEqual([at(MONDAY, 9), at(MONDAY, 11)]);
  });

  it("excludes slots that have already passed today", () => {
    const noon = at(MONDAY, 12);
    const slots = getAvailableSlots(
      [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
      [],
      [],
      60,
      1,
      noon,
    );
    // 9, 10, 11 have passed; the noon slot itself is excluded too (a slot
    // starting exactly "now" isn't bookable); 13 through 16 remain
    expect(slots).toEqual([at(MONDAY, 13), at(MONDAY, 14), at(MONDAY, 15), at(MONDAY, 16)]);
  });

  it("supports multiple rules per day (split shifts)", () => {
    const slots = getAvailableSlots(
      [
        { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
        { dayOfWeek: 1, startTime: "13:00", endTime: "17:00" },
      ],
      [],
      [],
      60,
      1,
      MONDAY,
    );
    expect(slots).toHaveLength(7); // 9,10,11 + 13,14,15,16
    expect(slots.some((s) => s.getHours() === 12)).toBe(false);
  });

  it("only generates slots on matching days of the week within the window", () => {
    // Rule only applies Wednesdays (dayOfWeek 3); window covers Mon-Wed.
    const slots = getAvailableSlots(
      [{ dayOfWeek: 3, startTime: "09:00", endTime: "10:00" }],
      [],
      [],
      60,
      3,
      MONDAY,
    );
    expect(slots).toHaveLength(1);
    expect(slots[0].getDay()).toBe(3);
  });

  it("returns no slots when there are no matching availability rules", () => {
    const slots = getAvailableSlots([], [], [], 60, 7, MONDAY);
    expect(slots).toHaveLength(0);
  });
});
