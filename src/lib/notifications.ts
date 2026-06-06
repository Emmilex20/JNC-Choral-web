import { NotificationAudience, NotificationType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type NotificationViewer = {
  id?: string | null;
  role?: string | null;
  isChorister?: boolean | null;
  choristerVerified?: boolean | null;
};

type NotificationInput = {
  audience: NotificationAudience;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  sourceId?: string | null;
  actorId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export function isMissingNotificationsTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021" &&
    typeof error.meta?.table === "string" &&
    error.meta.table.includes("Notification")
  );
}

export function getNotificationAudiencesForViewer(viewer?: NotificationViewer | null) {
  const audiences: NotificationAudience[] = [NotificationAudience.PUBLIC];

  if (viewer?.role === "ADMIN") {
    audiences.push(NotificationAudience.ADMIN);
  }

  if (viewer?.isChorister && viewer.choristerVerified) {
    audiences.push(NotificationAudience.CHORISTERS);
  }

  return audiences;
}

export async function createOrUpdateNotification(input: NotificationInput) {
  try {
    const data = {
      audience: input.audience,
      type: input.type,
      sourceId: input.sourceId ?? null,
      title: input.title.trim(),
      body: input.body.trim(),
      href: input.href?.trim() || null,
      actorId: input.actorId ?? null,
      metadata: input.metadata,
    };

    const notification = input.sourceId
      ? await prisma.notification.upsert({
          where: {
            type_sourceId_audience: {
              type: input.type,
              sourceId: input.sourceId,
              audience: input.audience,
            },
          },
          create: data,
          update: data,
          select: { id: true },
        })
      : await prisma.notification.create({
          data,
          select: { id: true },
        });

    await prisma.notificationRead.deleteMany({
      where: { notificationId: notification.id },
    });

    return notification;
  } catch (error) {
    if (isMissingNotificationsTableError(error)) return null;
    throw error;
  }
}

export async function deleteNotificationForSource(input: {
  audience: NotificationAudience;
  type: NotificationType;
  sourceId: string;
}) {
  try {
    await prisma.notification.deleteMany({
      where: {
        audience: input.audience,
        type: input.type,
        sourceId: input.sourceId,
      },
    });
  } catch (error) {
    if (isMissingNotificationsTableError(error)) return;
    throw error;
  }
}

export { NotificationAudience, NotificationType };
