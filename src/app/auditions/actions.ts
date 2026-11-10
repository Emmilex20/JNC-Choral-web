"use server";

import { prisma } from "@/lib/prisma";
import { auditionSchema } from "@/lib/audition-schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function submitAuditionAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      ok: false as const,
      error: "Please log in to submit your audition.",
    };
  }

  if (!(await consumeRateLimit(`audition:${session.user.id}`, 5, 24 * 60 * 60 * 1000))) {
    return {
      ok: false as const,
      error: "You have submitted too many applications today. Please try again tomorrow.",
    };
  }

  const parsed = auditionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid form data",
    };
  }

  const data = parsed.data;

  try {
    await prisma.auditionApplication.create({
      data: {
        userId: session.user.id,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        city: data.city ?? null,
        category: data.category,

        voicePart: data.voicePart ?? null,
        singingExperience: data.singingExperience ?? null,
        auditionSong: data.auditionSong ?? null,

        instrument: data.instrument ?? null,
        instrumentLevel: data.instrumentLevel ?? null,
        canSightRead: data.canSightRead ?? null,

        productionRole: data.productionRole ?? null,
        portfolioLink: data.portfolioLink?.trim() ? data.portfolioLink : null,

        notes: data.notes ?? null,
      },
    });

    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "Something went wrong while submitting. Please try again.",
    };
  }
}
