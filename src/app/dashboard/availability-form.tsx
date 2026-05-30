"use client";

import { useState } from "react";
import { saveAvailability, type SaveAvailabilityInput } from "./actions";

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export type InitialValues = SaveAvailabilityInput;

export function AvailabilityForm({ initial }: { initial: InitialValues }) {
  const [eventTitle, setEventTitle] = useState(initial.eventTitle);
  const [eventSlug, setEventSlug] = useState(initial.eventSlug);
  const [eventDuration, setEventDuration] = useState(initial.eventDuration);
  const [rules, setRules] = useState(initial.rules);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function updateRule(idx: number, patch: Partial<(typeof rules)[number]>) {
    setRules((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await saveAvailability({ eventTitle, eventSlug, eventDuration, rules });

    setLoading(false);
    setMessage(
      res.error
        ? { kind: "error", text: res.error }
        : { kind: "success", text: "Tersimpan!" }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-3 rounded border p-4">
        <h2 className="font-semibold">Jenis Pertemuan</h2>
        <label className="block">
          <span className="text-sm">Judul</span>
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </label>
        <label className="block">
          <span className="text-sm">Slug (untuk URL)</span>
          <input
            type="text"
            value={eventSlug}
            onChange={(e) => setEventSlug(e.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </label>
        <label className="block">
          <span className="text-sm">Durasi (menit)</span>
          <input
            type="number"
            value={eventDuration}
            onChange={(e) => setEventDuration(Number(e.target.value))}
            min={5}
            max={480}
            className="mt-1 w-full rounded border p-2"
          />
        </label>
      </section>

      <section className="space-y-2 rounded border p-4">
        <h2 className="font-semibold">Jam Kerja Mingguan</h2>
        {rules.map((rule, idx) => (
          <div key={rule.dayOfWeek} className="flex items-center gap-3">
            <label className="flex w-28 items-center gap-2">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(e) => updateRule(idx, { enabled: e.target.checked })}
              />
              <span>{DAY_NAMES[rule.dayOfWeek]}</span>
            </label>
            <input
              type="time"
              value={rule.startTime}
              onChange={(e) => updateRule(idx, { startTime: e.target.value })}
              disabled={!rule.enabled}
              className="rounded border p-1 disabled:opacity-40"
            />
            <span>–</span>
            <input
              type="time"
              value={rule.endTime}
              onChange={(e) => updateRule(idx, { endTime: e.target.value })}
              disabled={!rule.enabled}
              className="rounded border p-1 disabled:opacity-40"
            />
          </div>
        ))}
      </section>

      {message && (
        <p
          className={`rounded p-2 text-sm ${
            message.kind === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}