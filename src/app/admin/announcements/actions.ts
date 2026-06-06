"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth";
import { isAdminSession } from "@/lib/authz";
import {
  createOrUpdateNotification,
  deleteNotificationForSource,
  NotificationAudience,
  NotificationType,
} from "@/lib/notifications";
import { z } from "zod";
import { getServerSession } from "next-auth";

const CreateSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(5),
});

export async function createAnnouncementAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.announcement.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      isPublished: false,
    },
  });

  return { ok: true as const };
}

const UpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  body: z.string().min(5),
});

export async function updateAnnouncementAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const announcement = await prisma.announcement.update({
    where: { id: parsed.data.id },
    data: { title: parsed.data.title, body: parsed.data.body },
  });

  if (announcement.isPublished) {
    await createOrUpdateNotification({
      audience: NotificationAudience.PUBLIC,
      type: NotificationType.PUBLIC_ANNOUNCEMENT,
      sourceId: announcement.id,
      title: announcement.title,
      body: announcement.body,
      href: `/news/${announcement.id}`,
      actorId: session.user.id,
    });
  }

  return { ok: true as const };
}

const ToggleSchema = z.object({
  id: z.string().min(1),
  isPublished: z.boolean(),
});

export async function toggleAnnouncementPublishAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = ToggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const announcement = await prisma.announcement.update({
    where: { id: parsed.data.id },
    data: { isPublished: parsed.data.isPublished },
  });

  if (announcement.isPublished) {
    await createOrUpdateNotification({
      audience: NotificationAudience.PUBLIC,
      type: NotificationType.PUBLIC_ANNOUNCEMENT,
      sourceId: announcement.id,
      title: announcement.title,
      body: announcement.body,
      href: `/news/${announcement.id}`,
      actorId: session.user.id,
    });
  } else {
    await deleteNotificationForSource({
      audience: NotificationAudience.PUBLIC,
      type: NotificationType.PUBLIC_ANNOUNCEMENT,
      sourceId: announcement.id,
    });
  }

  return { ok: true as const };
}

const DeleteSchema = z.object({ id: z.string().min(1) });

export async function deleteAnnouncementAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.announcement.delete({ where: { id: parsed.data.id } });
  await deleteNotificationForSource({
    audience: NotificationAudience.PUBLIC,
    type: NotificationType.PUBLIC_ANNOUNCEMENT,
    sourceId: parsed.data.id,
  });
  return { ok: true as const };
}
