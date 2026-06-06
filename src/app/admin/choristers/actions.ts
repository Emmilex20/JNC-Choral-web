"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getAttendanceWindowState } from "@/lib/attendance-policy";
import { isAdminSession } from "@/lib/authz";
import {
  createOrUpdateNotification,
  deleteNotificationForSource,
  NotificationAudience,
  NotificationType,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const NoticeCreateSchema = z.object({
  title: z.string().min(2).max(120),
  body: z.string().min(2).max(2000),
  attachmentUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
});

export async function createChoristerNoticeAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

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

  if (notice.isPublished) {
    await createOrUpdateNotification({
      audience: NotificationAudience.CHORISTERS,
      type: NotificationType.CHORISTER_NOTICE,
      sourceId: notice.id,
      title: notice.title,
      body: notice.body,
      href: "/choristers#member-notices",
      actorId: session.user.id,
    });
  }

  return { ok: true as const, notice };
}

const NoticeToggleSchema = z.object({
  id: z.string().min(1),
  isPublished: z.boolean(),
});

export async function toggleChoristerNoticeAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = NoticeToggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const notice = await prisma.choristerNotice.update({
    where: { id: parsed.data.id },
    data: { isPublished: parsed.data.isPublished },
  });

  if (notice.isPublished) {
    await createOrUpdateNotification({
      audience: NotificationAudience.CHORISTERS,
      type: NotificationType.CHORISTER_NOTICE,
      sourceId: notice.id,
      title: notice.title,
      body: notice.body,
      href: "/choristers#member-notices",
      actorId: session.user.id,
    });
  } else {
    await deleteNotificationForSource({
      audience: NotificationAudience.CHORISTERS,
      type: NotificationType.CHORISTER_NOTICE,
      sourceId: notice.id,
    });
  }

  return { ok: true as const };
}

const NoticeDeleteSchema = z.object({ id: z.string().min(1) });

export async function deleteChoristerNoticeAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = NoticeDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.choristerNotice.delete({ where: { id: parsed.data.id } });
  await deleteNotificationForSource({
    audience: NotificationAudience.CHORISTERS,
    type: NotificationType.CHORISTER_NOTICE,
    sourceId: parsed.data.id,
  });
  return { ok: true as const };
}

const RehearsalCreateSchema = z.object({
  title: z.string().min(2).max(120),
  startsAt: z.string().min(1),
});

export async function createRehearsalAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

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

  await createOrUpdateNotification({
    audience: NotificationAudience.CHORISTERS,
    type: NotificationType.REHEARSAL_CREATED,
    sourceId: rehearsal.id,
    title: "New rehearsal scheduled",
    body: `${rehearsal.title} is scheduled for ${rehearsal.startsAt.toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    })}.`,
    href: "/choristers#rehearsal-deck",
    actorId: session.user.id,
  });

  return { ok: true as const, rehearsal };
}

const RehearsalDeleteSchema = z.object({ id: z.string().min(1) });

export async function deleteRehearsalAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = RehearsalDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.rehearsal.delete({ where: { id: parsed.data.id } });
  await deleteNotificationForSource({
    audience: NotificationAudience.CHORISTERS,
    type: NotificationType.REHEARSAL_CREATED,
    sourceId: parsed.data.id,
  });
  return { ok: true as const };
}

const ConfirmAttendanceSchema = z.object({ id: z.string().min(1) });

export async function confirmAttendanceAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = ConfirmAttendanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.attendanceRecord.update({
    where: { id: parsed.data.id },
    data: {
      confirmedAt: new Date(),
      confirmedBy: session?.user?.id ?? null,
    },
  });

  return { ok: true as const };
}

export async function rejectAttendanceAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = ConfirmAttendanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const record = await prisma.attendanceRecord.findUnique({
    where: { id: parsed.data.id },
    include: { rehearsal: { select: { startsAt: true } } },
  });

  if (!record) return { ok: true as const };

  if (getAttendanceWindowState(record.rehearsal.startsAt) === "CLOSED") {
    const now = new Date();
    const updated = await prisma.attendanceRecord.update({
      where: { id: parsed.data.id },
      data: {
        status: "ABSENT",
        excuseNote: null,
        autoMarked: true,
        markedAt: now,
        confirmedAt: now,
        confirmedBy: "system",
      },
    });
    return {
      ok: true as const,
      record: {
        status: updated.status,
        excuseNote: updated.excuseNote,
        autoMarked: updated.autoMarked,
        markedAt: updated.markedAt.toISOString(),
        confirmedAt: updated.confirmedAt ? updated.confirmedAt.toISOString() : null,
      },
    };
  }

  await prisma.attendanceRecord.delete({ where: { id: parsed.data.id } });
  return { ok: true as const };
}
