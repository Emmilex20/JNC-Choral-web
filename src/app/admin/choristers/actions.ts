"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

function requireAdmin(session: any) {
  return session?.user && (session.user as any).role === "ADMIN";
}

const NoticeCreateSchema = z.object({
  title: z.string().min(2).max(120),
  body: z.string().min(2).max(2000),
  attachmentUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
});

export async function createChoristerNoticeAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = NoticeCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const notice = await prisma.choristerNotice.create({
    data: {
      title: parsed.data.title.trim(),
      body: parsed.data.body.trim(),
      attachmentUrl: parsed.data.attachmentUrl?.trim() || null,
      isPublished: parsed.data.isPublished ?? true,
    },
  });

  return { ok: true as const, notice };
}

const NoticeToggleSchema = z.object({
  id: z.string().min(1),
  isPublished: z.boolean(),
});

export async function toggleChoristerNoticeAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = NoticeToggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.choristerNotice.update({
    where: { id: parsed.data.id },
    data: { isPublished: parsed.data.isPublished },
  });

  return { ok: true as const };
}

const NoticeDeleteSchema = z.object({ id: z.string().min(1) });

export async function deleteChoristerNoticeAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = NoticeDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.choristerNotice.delete({ where: { id: parsed.data.id } });
  return { ok: true as const };
}

const RehearsalCreateSchema = z.object({
  title: z.string().min(2).max(120),
  startsAt: z.string().min(1),
});

export async function createRehearsalAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = RehearsalCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const date = new Date(parsed.data.startsAt);
  if (Number.isNaN(date.getTime())) {
    return { ok: false as const, error: "Invalid date" };
  }

  const rehearsal = await prisma.rehearsal.create({
    data: {
      title: parsed.data.title.trim(),
      startsAt: date,
    },
  });

  return { ok: true as const, rehearsal };
}

const RehearsalDeleteSchema = z.object({ id: z.string().min(1) });

export async function deleteRehearsalAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = RehearsalDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.rehearsal.delete({ where: { id: parsed.data.id } });
  return { ok: true as const };
}

const ConfirmAttendanceSchema = z.object({ id: z.string().min(1) });

export async function confirmAttendanceAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = ConfirmAttendanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.attendanceRecord.update({
    where: { id: parsed.data.id },
    data: {
      confirmedAt: new Date(),
      confirmedBy: session.user?.id ?? null,
    },
  });

  return { ok: true as const };
}

export async function rejectAttendanceAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = ConfirmAttendanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.attendanceRecord.delete({ where: { id: parsed.data.id } });
  return { ok: true as const };
}
