"use server";

import { prisma } from "@/lib/prisma";
import { auditionSchema } from "@/lib/audition-schema";

export async function submitAuditionAction(input: unknown) {
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
  } catch (err: any) {
    return {
      ok: false as const,
      error: "Something went wrong while submitting. Please try again.",
    };
  }
}
