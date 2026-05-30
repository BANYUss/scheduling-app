import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AvailabilityForm, type InitialValues } from "./availability-form";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { eventTypes: true, availabilities: true },
  });
  if (!user) redirect("/login");

  const eventType = user.eventTypes[0];

  const fmt = (mins: number) =>
    `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

  const rules = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const existing = user.availabilities.find((a) => a.dayOfWeek === dayOfWeek);
    return existing
      ? {
          dayOfWeek,
          enabled: true,
          startTime: fmt(existing.startTime),
          endTime: fmt(existing.endTime),
        }
      : { dayOfWeek, enabled: false, startTime: "09:00", endTime: "17:00" };
  });

  const initial: InitialValues = {
    eventTitle: eventType?.title ?? "Pertemuan 30 menit",
    eventSlug: eventType?.slug ?? "meet",
    eventDuration: eventType?.durationMinutes ?? 30,
    rules,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Halo, {user.name} 👋</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="text-sm text-gray-600 underline">
            Logout
          </button>
        </form>
      </header>

      {eventType && (
        <p className="text-sm text-gray-600">
          Link booking publik:{" "}
          <code className="rounded bg-gray-100 px-2 py-1">
            /{user.username}/{eventType.slug}
          </code>{" "}
          (aktif setelah Fase 3)
        </p>
      )}

      <AvailabilityForm initial={initial} />
    </div>
  );
}