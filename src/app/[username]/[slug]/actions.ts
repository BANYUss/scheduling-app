"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const inputSchema = z.object({
  eventTypeId: z.string().min(1),
  startTimeISO: z.string().datetime(),
  guestName: z.string().min(1, "Nama wajib diisi"),
  guestEmail: z.string().email("Email tidak valid"),
  guestTimezone: z.string().min(1),
});

export type CreateBookingInput = z.infer<typeof inputSchema>;

export async function createBooking(input: CreateBookingInput) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { eventTypeId, startTimeISO, guestName, guestEmail, guestTimezone } =
    parsed.data;

  const eventType = await prisma.eventType.findUnique({
    where: { id: eventTypeId },
    include: { user: { select: { username: true } } },
  });
  if (!eventType) return { error: "Jenis pertemuan tidak ditemukan" };

  const startTime = new Date(startTimeISO);
  const endTime = new Date(
    startTime.getTime() + eventType.durationMinutes * 60 * 1000
  );

  try {
    await prisma.booking.create({
      data: {
        eventTypeId: eventType.id,
        userId: eventType.userId,
        startTime,
        endTime,
        guestName,
        guestEmail,
        guestTimezone,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        error: "Slot ini baru saja dipesan orang lain. Pilih slot lain.",
      };
    }
    throw err;
  }

  revalidatePath(`/${eventType.user.username}/${eventType.slug}`);
  return { success: true };
}