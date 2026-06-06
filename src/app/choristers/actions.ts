"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import {
  ATTENDANCE_STATUSES,
  getAttendanceWindowState,
} from "@/lib/attendance-policy";
import { prisma } from "@/lib/prisma";

function canAccess(user: { role?: string; isChorister?: boolean; choristerVerified?: boolean }) {
  if (user.role === "ADMIN") return true;
  return Boolean(user.isChorister && user.choristerVerified);
}

const ProfileSchema = z.object({
  phone: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  voicePart: z.string().max(50).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().max(40).optional(),
  maritalStatus: z.string().max(40).optional(),
  emergencyContact: z.string().max(120).optional(),
  stateOfOrigin: z.string().max(60).optional(),
  currentParish: z.string().max(120).optional(),
  socialHandle: z.string().max(120).optional(),
  passportImageUrl: z.string().url().max(500).optional().or(z.literal("")),
});

export async function upsertChoristerProfileAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isChorister: true, choristerVerified: true },
  });
  if (!user || !canAccess(user)) return { ok: false as const, error: "Unauthorized" };

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
      gender: parsed.data.gender?.trim() || null,
      maritalStatus: parsed.data.maritalStatus?.trim() || null,
      emergencyContact: parsed.data.emergencyContact?.trim() || null,
      stateOfOrigin: parsed.data.stateOfOrigin?.trim() || null,
      currentParish: parsed.data.currentParish?.trim() || null,
      socialHandle: parsed.data.socialHandle?.trim() || null,
      passportImageUrl: parsed.data.passportImageUrl?.trim() || null,
    },
    update: {
      phone: parsed.data.phone?.trim() || null,
      address: parsed.data.address?.trim() || null,
      voicePart: parsed.data.voicePart?.trim() || null,
      dateOfBirth,
      gender: parsed.data.gender?.trim() || null,
      maritalStatus: parsed.data.maritalStatus?.trim() || null,
      emergencyContact: parsed.data.emergencyContact?.trim() || null,
      stateOfOrigin: parsed.data.stateOfOrigin?.trim() || null,
      currentParish: parsed.data.currentParish?.trim() || null,
      socialHandle: parsed.data.socialHandle?.trim() || null,
      passportImageUrl: parsed.data.passportImageUrl?.trim() || null,
    },
  });

  return { ok: true as const };
}

const MarkAttendanceSchema = z.object({
  rehearsalId: z.string().min(1),
  status: z.enum(ATTENDANCE_STATUSES).default("PRESENT"),
  excuseNote: z.string().max(500).optional(),
});

export async function markAttendanceAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isChorister: true, choristerVerified: true },
  });
  if (!user || !canAccess(user)) return { ok: false as const, error: "Unauthorized" };

  const parsed = MarkAttendanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const rehearsal = await prisma.rehearsal.findUnique({
    where: { id: parsed.data.rehearsalId },
    select: { id: true, startsAt: true },
  });

  if (!rehearsal) return { ok: false as const, error: "Rehearsal not found" };

  const windowState = getAttendanceWindowState(rehearsal.startsAt);
  if (windowState === "UPCOMING") {
    return {
      ok: false as const,
      error: "Attendance opens on the rehearsal day.",
    };
  }

  if (windowState === "CLOSED") {
    return {
      ok: false as const,
      error: "Attendance marking has closed for this rehearsal.",
    };
  }

  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: {
      rehearsalId_userId: {
        rehearsalId: parsed.data.rehearsalId,
        userId: user.id,
      },
    },
    select: { confirmedAt: true },
  });

  if (existingRecord?.confirmedAt) {
    return {
      ok: false as const,
      error: "This attendance record has already been approved.",
    };
  }

  const excuseNote = parsed.data.excuseNote?.trim() ?? "";
  if (parsed.data.status === "EXCUSED" && excuseNote.length < 3) {
    return {
      ok: false as const,
      error: "Please add a short excuse note.",
    };
  }

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
      status: parsed.data.status,
      excuseNote: parsed.data.status === "EXCUSED" ? excuseNote : null,
      autoMarked: false,
    },
    update: {
      status: parsed.data.status,
      excuseNote: parsed.data.status === "EXCUSED" ? excuseNote : null,
      autoMarked: false,
      confirmedAt: null,
      confirmedBy: null,
      markedAt: new Date(),
    },
  });

  return { ok: true as const };
}
