import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { getAvailableSlots, type AvailabilityRule } from "./availability";

const JAKARTA = "Asia/Jakarta";

// Helper: buat Date (UTC) dari jam-dinding Jakarta.
function jakarta(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): Date {
  return DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: JAKARTA }
  ).toJSDate();
}

// Aturan: Senin 09:00–17:00 (dayOfWeek 1).
const mondayRule: AvailabilityRule = {
  dayOfWeek: 1,
  startMinute: 540,
  endMinute: 1020,
};

describe("getAvailableSlots", () => {
  it("menghasilkan 16 slot 30-menit untuk Senin 09:00–17:00", () => {
    const slots = getAvailableSlots({
      rules: [mondayRule],
      hostTimeZone: JAKARTA,
      slotDurationMinutes: 30,
      bookings: [],
      rangeStart: jakarta(2026, 6, 15, 0), // Senin
      rangeEnd: jakarta(2026, 6, 15, 23),
      now: jakarta(2026, 6, 1), // jauh sebelum range → tak ada yg tersaring
      minimumNoticeMinutes: 0,
    });

    expect(slots.length).toBe(16);
    // 09:00 Jakarta = 02:00 UTC
    expect(slots[0].start.toISOString()).toBe("2026-06-15T02:00:00.000Z");
    // slot terakhir mulai 16:30 Jakarta = 09:30 UTC
    expect(slots[15].start.toISOString()).toBe("2026-06-15T09:30:00.000Z");
  });
  
describe("getAvailableSlots — DST (America/New_York)", () => {
  const NY = "America/New_York";
  // Rabu 09:00–10:00
  const wednesdayRule: AvailabilityRule = {
    dayOfWeek: 3,
    startMinute: 540,
    endMinute: 600,
  };

  function ny(year: number, month: number, day: number, hour = 0): Date {
    return DateTime.fromObject({ year, month, day, hour }, { zone: NY }).toJSDate();
  }

  it("musim dingin (EST, UTC-5): 09:00 NY = 14:00 UTC", () => {
    const slots = getAvailableSlots({
      rules: [wednesdayRule],
      hostTimeZone: NY,
      slotDurationMinutes: 30,
      bookings: [],
      rangeStart: ny(2026, 2, 11, 0), // Rabu, sebelum DST
      rangeEnd: ny(2026, 2, 11, 23),
      now: ny(2026, 1, 1),
      minimumNoticeMinutes: 0,
    });
    expect(slots[0].start.toISOString()).toBe("2026-02-11T14:00:00.000Z");
  });

  it("musim panas (EDT, UTC-4): 09:00 NY = 13:00 UTC", () => {
    const slots = getAvailableSlots({
      rules: [wednesdayRule],
      hostTimeZone: NY,
      slotDurationMinutes: 30,
      bookings: [],
      rangeStart: ny(2026, 7, 1, 0), // Rabu, setelah DST
      rangeEnd: ny(2026, 7, 1, 23),
      now: ny(2026, 1, 1),
      minimumNoticeMinutes: 0,
    });
    expect(slots[0].start.toISOString()).toBe("2026-07-01T13:00:00.000Z");
  });
});

  it("membuang slot yang bentrok dengan booking", () => {
    const slots = getAvailableSlots({
      rules: [mondayRule],
      hostTimeZone: JAKARTA,
      slotDurationMinutes: 30,
      bookings: [
        { start: jakarta(2026, 6, 15, 10, 0), end: jakarta(2026, 6, 15, 10, 30) },
      ],
      rangeStart: jakarta(2026, 6, 15, 0),
      rangeEnd: jakarta(2026, 6, 15, 23),
      now: jakarta(2026, 6, 1),
      minimumNoticeMinutes: 0,
    });

    expect(slots.length).toBe(15); // slot 10:00 hilang
    const has10 = slots.some(
      (s) => s.start.toISOString() === "2026-06-15T03:00:00.000Z" // 10:00 Jakarta
    );
    expect(has10).toBe(false);
  });

  it("membuang slot yang sudah lewat (sebelum 'now')", () => {
    const slots = getAvailableSlots({
      rules: [mondayRule],
      hostTimeZone: JAKARTA,
      slotDurationMinutes: 30,
      bookings: [],
      rangeStart: jakarta(2026, 6, 15, 0),
      rangeEnd: jakarta(2026, 6, 15, 23),
      now: jakarta(2026, 6, 15, 12, 0), // sekarang jam 12:00 Jakarta
      minimumNoticeMinutes: 0,
    });

    expect(slots.length).toBe(10); // hanya 12:00–16:30
    // slot pertama yang tersisa: 12:00 Jakarta = 05:00 UTC
    expect(slots[0].start.toISOString()).toBe("2026-06-15T05:00:00.000Z");
  });
});