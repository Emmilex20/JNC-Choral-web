import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import {
  getNotificationAudiencesForViewer,
  isMissingNotificationsTableError,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getViewer() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session,
      user: null,
      audiences: getNotificationAudiencesForViewer(null),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      isChorister: true,
      choristerVerified: true,
    },
  });

  return {
    session,
    user,
    audiences: getNotificationAudiencesForViewer(user),
  };
}

export async function GET() {
  try {
    const { user, audiences } = await getViewer();

    const notifications = await prisma.notification.findMany({
      where: { audience: { in: audiences } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        audience: true,
        type: true,
        title: true,
        body: true,
        href: true,
        createdAt: true,
      },
    });

    const readRows = user
      ? await prisma.notificationRead.findMany({
          where: {
            userId: user.id,
            notificationId: { in: notifications.map((notification) => notification.id) },
          },
          select: { notificationId: true },
        })
      : [];
    const readIds = new Set(readRows.map((row) => row.notificationId));

    const unreadCount = user
      ? await prisma.notification.count({
          where: {
            audience: { in: audiences },
            reads: { none: { userId: user.id } },
          },
        })
      : 0;

    return NextResponse.json({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        audience: notification.audience,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        href: notification.href,
        createdAt: notification.createdAt.toISOString(),
        isRead: readIds.has(notification.id),
      })),
      unreadCount,
      canMarkRead: Boolean(user),
    });
  } catch (error) {
    if (isMissingNotificationsTableError(error)) {
      return NextResponse.json({
        notifications: [],
        unreadCount: 0,
        canMarkRead: false,
      });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const { user, audiences } = await getViewer();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const input = body as { notificationId?: unknown; all?: unknown };

  try {
    if (input.all === true) {
      const notifications = await prisma.notification.findMany({
        where: { audience: { in: audiences } },
        select: { id: true },
        take: 200,
      });

      if (notifications.length > 0) {
        await prisma.notificationRead.createMany({
          data: notifications.map((notification) => ({
            notificationId: notification.id,
            userId: user.id,
          })),
          skipDuplicates: true,
        });
      }

      return NextResponse.json({ ok: true });
    }

    if (typeof input.notificationId !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 400 });
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: input.notificationId,
        audience: { in: audiences },
      },
      select: { id: true },
    });

    if (!notification) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    await prisma.notificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId: notification.id,
          userId: user.id,
        },
      },
      create: {
        notificationId: notification.id,
        userId: user.id,
      },
      update: { readAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isMissingNotificationsTableError(error)) {
      return NextResponse.json({ ok: true });
    }
    throw error;
  }
}
