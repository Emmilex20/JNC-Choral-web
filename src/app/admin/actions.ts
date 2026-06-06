"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth";
import { isAdminSession } from "@/lib/authz";
import { CURRENT_AUDITION_SETTING_ID } from "@/lib/audition-settings";
import { z } from "zod";
import { getServerSession } from "next-auth";

const Schema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "SHORTLISTED", "ACCEPTED", "REJECTED"]),
});

const AuditionSettingSchema = z.object({
  startsAt: z.string().optional(),
  venue: z.string().max(180).optional(),
  note: z.string().max(260).optional(),
  anticipationText: z.string().max(320).optional(),
});

export async function updateAuditionStatusAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input" };
  }

  try {
    await prisma.auditionApplication.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Failed to update status" };
  }
}

export async function updateAuditionSettingAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const parsed = AuditionSettingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input" };
  }

  const data = parsed.data;
  const startsAtValue = data.startsAt?.trim();
  const startsAt = startsAtValue ? new Date(startsAtValue) : null;

  if (startsAtValue && Number.isNaN(startsAt?.getTime())) {
    return { ok: false as const, error: "Invalid audition date" };
  }

  try {
    const setting = await prisma.auditionSetting.upsert({
      where: { id: CURRENT_AUDITION_SETTING_ID },
      update: {
        startsAt,
        venue: data.venue?.trim() || null,
        note: data.note?.trim() || null,
        anticipationText: data.anticipationText?.trim() || null,
      },
      create: {
        id: CURRENT_AUDITION_SETTING_ID,
        startsAt,
        venue: data.venue?.trim() || null,
        note: data.note?.trim() || null,
        anticipationText: data.anticipationText?.trim() || null,
      },
    });

    return {
      ok: true as const,
      setting: {
        startsAt: setting.startsAt ? setting.startsAt.toISOString() : "",
        venue: setting.venue ?? "",
        note: setting.note ?? "",
        anticipationText: setting.anticipationText ?? "",
      },
    };
  } catch {
    return { ok: false as const, error: "Failed to update audition schedule" };
  }
}
