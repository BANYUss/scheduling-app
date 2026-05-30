import { DateTime } from "luxon";
// Satu aturan jam kerja berulang milik host (jam LOKAL host).
// Spec langkah 2-3: proyeksikan aturan berulang ke tanggal nyata,
// lalu ubah jam lokal host → instan UTC (AMAN DST).
function buildDailyWindows(input: AvailabilityInput): TimeInterval[] {
  const windows: TimeInterval[] = [];
  const zone = input.hostTimeZone;

  let cursor = DateTime.fromJSDate(input.rangeStart, { zone }).startOf("day");
  const lastDay = DateTime.fromJSDate(input.rangeEnd, { zone }).startOf("day");

  while (cursor <= lastDay) {
    const dayOfWeek = cursor.weekday % 7; // Luxon: Senin=1..Minggu=7 → 0=Minggu..6=Sabtu

    for (const rule of input.rules) {
      if (rule.dayOfWeek !== dayOfWeek) continue;

      const windowStart = cursor.set({
        hour: Math.floor(rule.startMinute / 60),
        minute: rule.startMinute % 60,
        second: 0,
        millisecond: 0,
      });
      const windowEnd = cursor.set({
        hour: Math.floor(rule.endMinute / 60),
        minute: rule.endMinute % 60,
        second: 0,
        millisecond: 0,
      });

      windows.push({
        start: windowStart.toJSDate(),
        end: windowEnd.toJSDate(),
      });
    }

    cursor = cursor.plus({ days: 1 });
  }

  return windows;
}

// Spec langkah 4: potong satu jendela kerja jadi slot berdurasi tetap.
function sliceIntoSlots(window: TimeInterval, durationMinutes: number): TimeInterval[] {
  const slots: TimeInterval[] = [];
  const durationMs = durationMinutes * 60 * 1000;

  let cursor = window.start.getTime();
  const end = window.end.getTime();

  while (cursor + durationMs <= end) {
    slots.push({
      start: new Date(cursor),
      end: new Date(cursor + durationMs),
    });
    cursor += durationMs;
  }

  return slots;
}
export type AvailabilityRule = {
  dayOfWeek: number; // 0 = Minggu ... 6 = Sabtu
  startMinute: number; // menit dari tengah malam (09:00 = 540)
  endMinute: number; // (17:00 = 1020)
};

// Sepotong waktu konkret, selalu dalam UTC.
export type TimeInterval = {
  start: Date; // UTC
  end: Date; // UTC
};

// Semua bahan yang dibutuhkan engine.
export type AvailabilityInput = {
  rules: AvailabilityRule[]; // aturan jam kerja host
  hostTimeZone: string; // zona IANA host, mis. "Asia/Jakarta"
  slotDurationMinutes: number; // durasi EventType (mis. 30)
  bookings: TimeInterval[]; // booking yang sudah ada (UTC)
  rangeStart: Date; // UTC — awal jendela yang dilihat tamu
  rangeEnd: Date; // UTC — akhir jendela
  now: Date; // "waktu sekarang" — disuntikkan, bukan dibaca sendiri
  minimumNoticeMinutes: number; // jeda minimum sebelum slot bisa dipesan
};

// Inilah jantungnya. Untuk sekarang masih kosong — kita isi di Langkah 3.
export function getAvailableSlots(input: AvailabilityInput): TimeInterval[] {
  // 1. Bangun jendela kerja harian (jam lokal host → UTC).
  const windows = buildDailyWindows(input);

  // 2. Potong tiap jendela jadi slot berdurasi tetap.
  const allSlots = windows.flatMap((w) =>
    sliceIntoSlots(w, input.slotDurationMinutes)
  );

  // 3. Batas paling awal yang boleh dipesan: sekarang + minimum notice.
  const earliestAllowed = new Date(
    input.now.getTime() + input.minimumNoticeMinutes * 60 * 1000
  );

  // 4. Saring slot.
  return allSlots.filter((slot) => {
    if (slot.start < earliestAllowed) return false;
    const clashes = input.bookings.some((booking) => overlaps(slot, booking));
    if (clashes) return false;
    return true;
  });
}

// Spec langkah 6: aturan tabrakan dua interval.
function overlaps(a: TimeInterval, b: TimeInterval): boolean {
  return a.start < b.end && b.start < a.end;
}