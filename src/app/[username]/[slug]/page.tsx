import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots, type AvailabilityRule } from "@/lib/availability";
import { BookingPicker } from "./booking-picker";

const RANGE_DAYS = 14;
const MINIMUM_NOTICE_MINUTES = 60;

export default async function BookingPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      eventTypes: { where: { slug } },
      availabilities: true,
      bookings: true,
    },
  });

  if (!user || user.eventTypes.length === 0) notFound();

  const eventType = user.eventTypes[0];

  const now = new Date();
  const rangeEnd = new Date(now.getTime() + RANGE_DAYS * 24 * 60 * 60 * 1000);

  const rules: AvailabilityRule[] = user.availabilities.map((a) => ({
    dayOfWeek: a.dayOfWeek,
    startMinute: a.startTime,
    endMinute: a.endTime,
  }));

  const slots = getAvailableSlots({
    rules,
    hostTimeZone: user.timezone,
    slotDurationMinutes: eventType.durationMinutes,
    bookings: user.bookings.map((b) => ({ start: b.startTime, end: b.endTime })),
    rangeStart: now,
    rangeEnd,
    now,
    minimumNoticeMinutes: MINIMUM_NOTICE_MINUTES,
  });

  const serializedSlots = slots.map((s) => ({
    start: s.start.toISOString(),
    end: s.end.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <header>
        <h1 className="text-2xl font-bold">
          {eventType.title} dengan {user.name}
        </h1>
        <p className="text-sm text-gray-600">
          Durasi: {eventType.durationMinutes} menit
        </p>
      </header>

      <BookingPicker
        slots={serializedSlots}
        hostName={user.name}
        eventTypeId={eventType.id}
      />
    </div>
  );
}