"use client";

import { useMemo, useState } from "react";
import { createBooking } from "./actions";

type SerializedSlot = { start: string; end: string };
type SlotInfo = { iso: string; time: string };
type DayGroup = { label: string; slots: SlotInfo[] };
type Status = "idle" | "loading" | "success" | { error: string };

type Props = {
  slots: SerializedSlot[];
  hostName: string;
  eventTypeId: string;
};

export function BookingPicker({ slots, hostName, eventTypeId }: Props) {
  const guestTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  const byDate = useMemo(() => {
    const dateFmt = new Intl.DateTimeFormat("id-ID", {
      timeZone: guestTz,
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const timeFmt = new Intl.DateTimeFormat("id-ID", {
      timeZone: guestTz,
      hour: "2-digit",
      minute: "2-digit",
    });
    const groups: Record<string, DayGroup> = {};
    for (const s of slots) {
      const d = new Date(s.start);
      const key = dateFmt.format(d);
      if (!groups[key]) groups[key] = { label: key, slots: [] };
      groups[key].slots.push({ iso: s.start, time: timeFmt.format(d) });
    }
    return Object.values(groups);
  }, [slots, guestTz]);

  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedIso) return;
    setStatus("loading");
    const res = await createBooking({
      eventTypeId,
      startTimeISO: selectedIso,
      guestName: name,
      guestEmail: email,
      guestTimezone: guestTz,
    });
    if (res.error) {
      setStatus({ error: res.error });
    } else {
      setStatus("success");
    }
  }

  if (status === "success") {
    const slot = slots.find((s) => s.start === selectedIso);
    const slotTime = slot
      ? new Intl.DateTimeFormat("id-ID", {
          timeZone: guestTz,
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(slot.start))
      : "";
    return (
      <div className="rounded border border-green-500 bg-green-50 p-4 text-green-800">
        <h2 className="font-bold">Booking dikonfirmasi 🎉</h2>
        <p className="mt-1">{slotTime}</p>
        <p className="mt-1 text-sm">Tercatat atas nama {name}.</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-gray-600">
        {hostName} belum menyetel jam kerja, atau tidak ada slot kosong dalam
        14 hari ke depan.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Waktu ditampilkan dalam zona waktu kamu: <code>{guestTz}</code>
      </p>

      {byDate.map((day) => (
        <section key={day.label}>
          <h2 className="mb-2 font-semibold">{day.label}</h2>
          <div className="flex flex-wrap gap-2">
            {day.slots.map((s) => (
              <button
                key={s.iso}
                type="button"
                onClick={() => setSelectedIso(s.iso)}
                className={`rounded border px-3 py-2 hover:bg-gray-100 ${
                  selectedIso === s.iso ? "border-black bg-gray-100" : ""
                }`}
              >
                {s.time}
              </button>
            ))}
          </div>
        </section>
      ))}

      {selectedIso && (
        <form onSubmit={handleConfirm} className="space-y-3 rounded border p-4">
          <h2 className="font-semibold">Detail kamu</h2>
          <input
            type="text"
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded border p-2"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border p-2"
          />
          {typeof status === "object" && (
            <p className="rounded bg-red-100 p-2 text-sm text-red-700">
              {status.error}
            </p>
          )}
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {status === "loading" ? "Memproses..." : "Konfirmasi booking"}
          </button>
        </form>
      )}
    </div>
  );
}