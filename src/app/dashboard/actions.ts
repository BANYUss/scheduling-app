"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const inputSchema = z.object({
  eventTitle: z.string().min(1, "Judul pertemuan wajib diisi"),
  eventSlug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, -"),
  eventDuration: z.number().int().min(5).max(480),
  rules: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        enabled: z.boolean(),
        startTime: z.string().regex(timeRegex, "Format jam tidak valid"),
        endTime: z.string().regex(timeRegex, "Format jam tidak valid"),
      })
    )
    .length(7),
});

export type SaveAvailabilityInput = z.infer<typeof inputSchema>;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export async function saveAvailability(input: SaveAvailabilityInput) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Tidak terotentikasi" };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { eventTitle, eventSlug, eventDuration, rules } = parsed.data;

  for (const r of rules) {
    if (r.enabled && toMinutes(r.endTime) <= toMinutes(r.startTime)) {
      return { error: "Jam selesai harus setelah jam mulai" };
    }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return { error: "User tidak ditemukan" };

  const existing = await prisma.eventType.findFirst({
    where: { userId: user.id },
  });

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.eventType.update({
        where: { id: existing.id },
        data: { title: eventTitle, slug: eventSlug, durationMinutes: eventDuration },
      });
    } else {
      await tx.eventType.create({
        data: {
          userId: user.id,
          title: eventTitle,
          slug: eventSlug,
          durationMinutes: eventDuration,
        },
      });
    }

    await tx.availability.deleteMany({ where: { userId: user.id } });
    const toInsert = rules
      .filter((r) => r.enabled)
      .map((r) => ({
        userId: user.id,
        dayOfWeek: r.dayOfWeek,
        startTime: toMinutes(r.startTime),
        endTime: toMinutes(r.endTime),
      }));
    if (toInsert.length > 0) {
      await tx.availability.createMany({ data: toInsert });
    }
  });

  revalidatePath("/dashboard");
  return { success: true };
}