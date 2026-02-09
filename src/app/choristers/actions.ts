"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

function canAccess(user: { role?: string; isChorister?: boolean; choristerVerified?: boolean } | null) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return Boolean(user.isChorister && user.choristerVerified);
}

const ProfileSchema = z.object({
  phone: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  voicePart: z.string().max(50).optional(),
  dateOfBirth: z.string().optional(),
  emergencyContact: z.string().max(120).optional(),
  stateOfOrigin: z.string().max(60).optional(),
  currentParish: z.string().max(120).optional(),
});

export async function upsertChoristerProfileAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isChorister: true, choristerVerified: true },
  });
  if (!canAccess(user)) return { ok: false as const, error: "Unauthorized" };

  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const dobRaw = parsed.data.dateOfBirth?.trim();
  let dateOfBirth: Date | null = null;
  if (dobRaw) {
    const parsedDate = new Date(dobRaw);
    if (Number.isNaN(parsedDate.getTime())) {
      return { ok: false as const, error: "Invalid date of birth" };
    }
    dateOfBirth = parsedDate;
  }

  await prisma.choristerProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      phone: parsed.data.phone?.trim() || null,
      address: parsed.data.address?.trim() || null,
      voicePart: parsed.data.voicePart?.trim() || null,
      dateOfBirth,
      emergencyContact: parsed.data.emergencyContact?.trim() || null,
      stateOfOrigin: parsed.data.stateOfOrigin?.trim() || null,
      currentParish: parsed.data.currentParish?.trim() || null,
    },
    update: {
      phone: parsed.data.phone?.trim() || null,
      address: parsed.data.address?.trim() || null,
      voicePart: parsed.data.voicePart?.trim() || null,
      dateOfBirth,
      emergencyContact: parsed.data.emergencyContact?.trim() || null,
      stateOfOrigin: parsed.data.stateOfOrigin?.trim() || null,
      currentParish: parsed.data.currentParish?.trim() || null,
    },
  });

  return { ok: true as const };
}

const MarkAttendanceSchema = z.object({
  rehearsalId: z.string().min(1),
});

export async function markAttendanceAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isChorister: true, choristerVerified: true },
  });
  if (!canAccess(user)) return { ok: false as const, error: "Unauthorized" };

  const parsed = MarkAttendanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.attendanceRecord.upsert({
    where: {
      rehearsalId_userId: {
        rehearsalId: parsed.data.rehearsalId,
        userId: user.id,
      },
    },
    create: {
      rehearsalId: parsed.data.rehearsalId,
      userId: user.id,
      status: "PRESENT",
    },
    update: {
      status: "PRESENT",
      confirmedAt: null,
      confirmedBy: null,
      markedAt: new Date(),
    },
  });

  return { ok: true as const };
}
