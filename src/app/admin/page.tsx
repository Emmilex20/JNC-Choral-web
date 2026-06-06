import Link from "next/link";
import {
  ArrowUpRight,
  BellRing,
  CalendarDays,
  ClipboardList,
  Images,
  Megaphone,
  Music2,
  UserCheck,
  UserCog,
  UsersRound,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { materializeAutoAbsences } from "@/lib/attendance-auto";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "./_components/admin-page-header";

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminPage() {
  await materializeAutoAbsences(prisma);

  const [
    totalAuditions,
    pendingAuditions,
    acceptedAuditions,
    eventsCount,
    publishedEvents,
    announcementsCount,
    publishedAnnouncements,
    galleryCount,
    musicCount,
    sheetCount,
    videoCount,
    choristerNoticesCount,
    usersCount,
    verifiedChoristers,
    pendingChoristers,
    rehearsalsCount,
    pendingAttendance,
    recentAuditions,
    upcomingEvents,
  ] = await Promise.all([
    prisma.auditionApplication.count(),
    prisma.auditionApplication.count({ where: { status: "PENDING" } }),
    prisma.auditionApplication.count({ where: { status: "ACCEPTED" } }),
    prisma.event.count(),
    prisma.event.count({ where: { isPublished: true } }),
    prisma.announcement.count(),
    prisma.announcement.count({ where: { isPublished: true } }),
    prisma.galleryItem.count(),
    prisma.musicItem.count(),
    prisma.musicSheet.count(),
    prisma.videoItem.count(),
    prisma.choristerNotice.count(),
    prisma.user.count(),
    prisma.user.count({ where: { isChorister: true, choristerVerified: true } }),
    prisma.user.count({ where: { isChorister: true, choristerVerified: false } }),
    prisma.rehearsal.count(),
    prisma.attendanceRecord.count({ where: { confirmedAt: null } }),
    prisma.auditionApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        fullName: true,
        category: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.event.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 4,
      select: {
        id: true,
        title: true,
        startsAt: true,
        isPublished: true,
      },
    }),
  ]);

  const mediaCount = galleryCount + musicCount + sheetCount + videoCount;
  const reviewQueue = pendingAuditions + pendingChoristers + pendingAttendance;
  const publishedContent = publishedEvents + publishedAnnouncements;

  const stats = [
    {
      label: "Review Queue",
      value: reviewQueue,
      detail: `${pendingAuditions} auditions, ${pendingChoristers} chorister requests, ${pendingAttendance} attendance requests`,
    },
    {
      label: "Members",
      value: verifiedChoristers,
      detail: `${usersCount} total accounts, ${pendingChoristers} awaiting verification`,
    },
    {
      label: "Published",
      value: publishedContent,
      detail: `${publishedEvents}/${eventsCount} events, ${publishedAnnouncements}/${announcementsCount} announcements`,
    },
    {
      label: "Media",
      value: mediaCount,
      detail: `${galleryCount} images, ${musicCount} tracks, ${sheetCount} sheets, ${videoCount} videos`,
    },
  ];

  const queue = [
    {
      href: "/admin/auditions",
      label: "Auditions",
      value: pendingAuditions,
      detail: `${acceptedAuditions} accepted from ${totalAuditions} applications`,
      icon: ClipboardList,
    },
    {
      href: "/admin/choristers/pending",
      label: "Chorister Verification",
      value: pendingChoristers,
      detail: "Requests waiting for admin decision",
      icon: UserCheck,
    },
    {
      href: "/admin/rehearsals",
      label: "Attendance Requests",
      value: pendingAttendance,
      detail: `${rehearsalsCount} rehearsals in the attendance ledger`,
      icon: CalendarDays,
    },
  ];

  const modules = [
    {
      href: "/admin/auditions",
      title: "Auditions",
      detail: "Schedule auditions and process applications.",
      count: totalAuditions,
      icon: ClipboardList,
    },
    {
      href: "/admin/rehearsals",
      title: "Rehearsals",
      detail: "Create rehearsals and approve attendance.",
      count: rehearsalsCount,
      icon: CalendarDays,
    },
    {
      href: "/admin/choristers",
      title: "Choristers",
      detail: "Inspect profiles, notes, and attendance history.",
      count: verifiedChoristers,
      icon: UsersRound,
    },
    {
      href: "/admin/choristers/notices",
      title: "Member Notices",
      detail: "Send private updates to verified choristers.",
      count: choristerNoticesCount,
      icon: BellRing,
    },
    {
      href: "/admin/events",
      title: "Events",
      detail: "Publish concerts, rehearsals, and programmes.",
      count: eventsCount,
      icon: CalendarDays,
    },
    {
      href: "/admin/announcements",
      title: "Announcements",
      detail: "Write public news and updates.",
      count: announcementsCount,
      icon: Megaphone,
    },
    {
      href: "/admin/gallery",
      title: "Gallery",
      detail: "Manage public image showcases.",
      count: galleryCount,
      icon: Images,
    },
    {
      href: "/admin/music",
      title: "Music",
      detail: "Manage audio tracks and choir sheet files.",
      count: musicCount + sheetCount,
      icon: Music2,
    },
    {
      href: "/admin/videos",
      title: "Videos",
      detail: "Upload performance videos and posters.",
      count: videoCount,
      icon: Video,
    },
    {
      href: "/admin/users",
      title: "Users",
      detail: "Edit roles, access, and chorister flags.",
      count: usersCount,
      icon: UserCog,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Command Center"
        title="A calmer dashboard for the whole choir operation."
        description="Scan the queue, jump into the right workspace, and keep the public site and private chorister portal under control without a long one-page scroll."
        actions={
          <Button
            asChild
            className="rounded-2xl"
          >
            <Link href="/admin/auditions">
              Open Applications
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="admin-stat-card min-h-0">
              <p className="text-sm font-medium text-white/68">{stat.label}</p>
              <p className="admin-metric-value">{formatCompactNumber(stat.value)}</p>
              <p className="text-sm leading-6 admin-subtle">{stat.detail}</p>
            </div>
          ))}
        </div>
      </AdminPageHeader>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="admin-section">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="admin-eyebrow">Needs Review</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Priority queue
              </h2>
            </div>
            <span className="admin-pill admin-pill-inline">{reviewQueue} open</span>
          </div>

          <div className="mt-5 grid gap-3">
            {queue.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="admin-rail-link items-center"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-amber-100">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-white">{item.label}</span>
                      <span className="mt-1 block text-sm admin-subtle">{item.detail}</span>
                    </span>
                  </span>
                  <strong>{item.value}</strong>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="admin-section">
          <p className="admin-eyebrow">Latest Movement</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent applications</h2>
              <div className="mt-3 grid gap-2">
                {recentAuditions.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm admin-subtle">
                    No applications yet.
                  </p>
                ) : (
                  recentAuditions.map((application) => (
                    <div
                      key={application.id}
                      className="rounded-2xl border border-white/10 bg-black/24 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">
                            {application.fullName}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                            {application.category}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/76">
                          {application.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">Upcoming events</h2>
              <div className="mt-3 grid gap-2">
                {upcomingEvents.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm admin-subtle">
                    No upcoming events.
                  </p>
                ) : (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-white/10 bg-black/24 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{event.title}</p>
                          <p className="mt-1 text-sm admin-subtle">
                            {formatDate(event.startsAt)}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/76">
                          {event.isPublished ? "Live" : "Draft"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-section">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="admin-eyebrow">Workspaces</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Open a focused admin page
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 admin-subtle">
            Each area now has its own route, so desktop and mobile admins can move with less scrolling and clearer context.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href} className="admin-nav-card">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="admin-pill admin-pill-inline">
                    {formatCompactNumber(module.count)}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 admin-subtle">{module.detail}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  Open workspace
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
