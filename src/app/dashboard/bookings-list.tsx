type BookingItem = {
  id: string;
  guestName: string;
  guestEmail: string;
  guestTimezone: string;
  startTime: Date;
  endTime: Date;
  eventType: { title: string };
};

export function BookingsList({
  bookings,
  hostTimezone,
}: {
  bookings: BookingItem[];
  hostTimezone: string;
}) {
  if (bookings.length === 0) {
    return <p className="text-gray-600">Belum ada booking masuk.</p>;
  }

  const dateFmt = new Intl.DateTimeFormat("id-ID", {
    timeZone: hostTimezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const timeFmt = new Intl.DateTimeFormat("id-ID", {
    timeZone: hostTimezone,
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <ul className="space-y-3">
      {bookings.map((b) => (
        <li key={b.id} className="rounded border p-3">
          <div className="font-semibold">{b.eventType.title}</div>
          <div className="text-sm">
            {dateFmt.format(b.startTime)} – {timeFmt.format(b.endTime)}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {b.guestName} ({b.guestEmail}) · zona tamu: {b.guestTimezone}
          </div>
        </li>
      ))}
    </ul>
  );
}