"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, BellRing, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  audience: "ADMIN" | "CHORISTERS" | "PUBLIC";
  type: string;
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
  isRead: boolean;
};

type NotificationResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
  canMarkRead: boolean;
};

function audienceLabel(audience: NotificationItem["audience"]) {
  if (audience === "ADMIN") return "Admin";
  if (audience === "CHORISTERS") return "Choristers";
  return "Public";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function NotificationBell({ compact = false }: { compact?: boolean }) {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationResponse>({
    notifications: [],
    unreadCount: 0,
    canMarkRead: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    if (status === "loading") return;

    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications", {
        cache: "no-store",
      });
      if (!res.ok) return;

      const nextData = (await res.json()) as NotificationResponse;
      setData({
        notifications: Array.isArray(nextData.notifications)
          ? nextData.notifications
          : [],
        unreadCount:
          typeof nextData.unreadCount === "number" ? nextData.unreadCount : 0,
        canMarkRead: Boolean(nextData.canMarkRead),
      });
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refreshNotifications();
    const interval = window.setInterval(refreshNotifications, 45000);
    return () => window.clearInterval(interval);
  }, [refreshNotifications]);

  async function markRead(notificationId: string) {
    if (!data.canMarkRead) return;

    setData((prev) => ({
      ...prev,
      unreadCount: Math.max(0, prev.unreadCount - 1),
      notifications: prev.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      ),
    }));

    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });
  }

  async function markAllRead() {
    if (!data.canMarkRead || data.unreadCount === 0) return;

    setData((prev) => ({
      ...prev,
      unreadCount: 0,
      notifications: prev.notifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    }));

    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  const Icon = data.unreadCount > 0 ? BellRing : Bell;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) refreshNotifications();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative rounded-2xl border border-white/0 text-white transition hover:border-white/10 hover:bg-white/10 hover:text-white",
            compact && "h-10 w-10"
          )}
          aria-label="Open notifications"
        >
          <Icon className="h-5 w-5" />
          {data.unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-200 px-1.5 text-[10px] font-bold text-black shadow-[0_0_0_2px_rgba(0,0,0,0.85)]">
              {data.unreadCount > 9 ? "9+" : data.unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(92vw,420px)] overflow-hidden border-white/10 bg-[#050505] p-0 text-white shadow-2xl"
      >
        <div className="border-b border-white/10 bg-white/5 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="mt-1 text-xs text-white/55">
                Routed by audience: admin, choristers, or public.
              </p>
            </div>
            {data.canMarkRead && data.unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white/76 transition hover:bg-white/10 hover:text-white"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Read all
              </button>
            ) : null}
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {isLoading && data.notifications.length === 0 ? (
            <p className="px-4 py-8 text-sm text-white/55">Loading notifications...</p>
          ) : data.notifications.length === 0 ? (
            <p className="px-4 py-8 text-sm text-white/55">
              No notifications yet.
            </p>
          ) : (
            data.notifications.map((notification) => {
              const content = (
                <div
                  className={cn(
                    "block border-b border-white/10 px-4 py-4 transition last:border-b-0 hover:bg-white/6",
                    !notification.isRead && data.canMarkRead && "bg-amber-200/6"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                        notification.isRead || !data.canMarkRead
                          ? "bg-white/18"
                          : "bg-amber-200"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/52">
                          {audienceLabel(notification.audience)}
                        </span>
                        <span className="text-[11px] text-white/42">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {notification.title}
                      </p>
                      <p className="mt-1 line-clamp-3 text-xs leading-5 text-white/62">
                        {notification.body}
                      </p>
                    </div>
                  </div>
                </div>
              );

              return notification.href ? (
                <Link
                  key={notification.id}
                  href={notification.href}
                  onClick={() => markRead(notification.id)}
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markRead(notification.id)}
                  className="w-full text-left"
                >
                  {content}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
