import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Megaphone,
  Trophy,
  UserCheck,
  UsersRound,
  Video,
  type LucideIcon,
} from "lucide-react";

import { authOptions } from "@/auth";
import { Button } from "@/components/ui/button";
import { materializeAutoAbsences } from "@/lib/attendance-auto";
import { getCurrentAuditionSetting } from "@/lib/audition-settings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dateTime = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});
const dateOnly = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "full",
  timeZone: "Africa/Lagos",
});

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-300/15 text-amber-100",
  ACCEPTED: "bg-emerald-300/15 text-emerald-100",
  REJECTED: "bg-red-300/15 text-red-100",
};

type Task = { href: string; label: string; hint: string; count: number; icon: LucideIcon };

async function getPageViews() {
  try {
    return await prisma.analyticsEvent.count({
      where: { name: "pageview", createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  await materializeAutoAbsences(prisma);
  const session = await getServerSession(authOptions);
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const now = new Date();

  const [
    pendingAuditions,
    pendingChoristers,
    pendingAttendance,
    pendingChallengeEntries,
    verifiedChoristers,
    totalUsers,
    totalApplications,
    upcomingEventCount,
    recentApplications,
    upcomingEvents,
    auditionSetting,
    pageViews,
  ] = await Promise.all([
    prisma.auditionApplication.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { isChorister: true, choristerVerified: false } }),
    prisma.attendanceRecord.count({ where: { confirmedAt: null } }),
    prisma.challengeSubmission.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { isChorister: true, choristerVerified: true } }),
    prisma.user.count(),
    prisma.auditionApplication.count(),
    prisma.event.count({ where: { isPublished: true, startsAt: { gte: now } } }),
    prisma.auditionApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, category: true, status: true, createdAt: true },
    }),
    prisma.event.findMany({
      where: { startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 5,
      select: { id: true, title: true, startsAt: true, isPublished: true },
    }),
    getCurrentAuditionSetting(),
    getPageViews(),
  ]);

  const tasks: Task[] = [
    {
      href: "/admin/auditions",
      label: "Audition applications",
      hint: "Waiting for a decision",
      count: pendingAuditions,
      icon: ClipboardList,
    },
    {
      href: "/admin/choristers/pending",
      label: "Chorister verification",
      hint: "People asking to join the chorister portal",
      count: pendingChoristers,
      icon: UserCheck,
    },
    {
      href: "/admin/rehearsals",
      label: "Attendance to approve",
      hint: "Marked by choristers, not yet approved",
      count: pendingAttendance,
      icon: CalendarDays,
    },
    {
      href: "/admin/challenges",
      label: "Challenge recordings",
      hint: "Submitted and waiting to be approved",
      count: pendingChallengeEntries,
      icon: Trophy,
    },
  ];
  const openTasks = tasks.filter((task) => task.count > 0);
  const totalOpen = tasks.reduce((sum, task) => sum + task.count, 0);

  const auditionDateSet =
    auditionSetting?.startsAt instanceof Date && auditionSetting.startsAt.getTime() > now.getTime();

  const kpis = [
    {
      label: "Verified choristers",
      value: verifiedChoristers,
      note: `${totalUsers} accounts in total`,
      href: "/admin/choristers",
    },
    {
      label: "Items to review",
      value: totalOpen,
      note: totalOpen === 0 ? "Nothing waiting" : "See the list below",
      href: "#attention",
    },
    {
      label: "Upcoming events",
      value: upcomingEventCount,
      note: "Published and in the future",
      href: "/admin/events",
    },
    {
      label: "Page views (7 days)",
      value: pageViews ?? "-",
      note: pageViews === null ? "Run the database migration to enable" : "Public pages only",
      href: "/admin/analytics",
    },
  ];

  const quickActions = [
    { href: "/admin/auditions", label: "Set audition date", icon: ClipboardList },
    { href: "/admin/events", label: "Add an event", icon: CalendarDays },
    { href: "/admin/announcements", label: "Post news", icon: Megaphone },
    { href: "/admin/videos", label: "Upload a video", icon: Video },
    { href: "/admin/rehearsals", label: "Add a rehearsal", icon: UsersRound },
    { href: "/admin/analytics", label: "View analytics", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-white/55">{dateOnly.format(now)}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white">
            Welcome back, {firstName}
          </h2>
          <p className="mt-2 text-sm text-white/65">
            {totalOpen === 0
              ? "You are all caught up."
              : `${totalOpen} ${totalOpen === 1 ? "item needs" : "items need"} your attention.`}
          </p>
        </div>
        <Button asChild variant="outline" className="w-fit rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10">
          <Link href="/">View public site</Link>
        </Button>
      </header>

      {!auditionDateSet ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-amber-200/25 bg-amber-200/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-amber-50">
            No upcoming audition date is set, so the website says &quot;Next auditions coming
            soon&quot;.
          </p>
          <Button asChild size="sm" className="w-fit rounded-xl bg-amber-300 font-semibold text-black hover:bg-amber-200">
            <Link href="/admin/auditions">Set the date</Link>
          </Button>
        </div>
      ) : null}

      <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/25 hover:bg-white/[0.07]"
          >
            <p className="text-sm font-medium text-white/65">{kpi.label}</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums text-white">{kpi.value}</p>
            <p className="mt-2 text-xs text-white/50">{kpi.note}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section
          id="attention"
          aria-labelledby="attention-title"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id="attention-title" className="text-lg font-semibold text-white">
              Needs your attention
            </h3>
            {totalOpen > 0 ? (
              <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-black">
                {totalOpen} open
              </span>
            ) : null}
          </div>

          {openTasks.length === 0 ? (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-emerald-50">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
              <p className="text-sm">Nothing is waiting for review right now.</p>
            </div>
          ) : (
            <ul className="mt-5 grid gap-3">
              {openTasks.map((task) => (
                <li key={task.href}>
                  <Link
                    href={task.href}
                    className="group flex items-center gap-4 rounded-xl border border-white/10 bg-black/25 p-4 transition hover:border-amber-200/30 hover:bg-white/[0.06]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-100">
                      <task.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-white">{task.label}</span>
                      <span className="block text-xs text-white/55">{task.hint}</span>
                    </span>
                    <span className="text-2xl font-semibold tabular-nums text-white">{task.count}</span>
                    <ArrowRight
                      className="h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="quick-title"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
        >
          <h3 id="quick-title" className="text-lg font-semibold text-white">
            Quick actions
          </h3>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <li key={action.label}>
                <Link
                  href={action.href}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-medium text-white/90 transition hover:border-white/25 hover:bg-white/[0.07]"
                >
                  <action.icon className="h-4 w-4 text-amber-100" aria-hidden />
                  {action.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-white/50">
            Not sure where something is? Open the{" "}
            <Link href="/admin/help" className="text-amber-100 underline underline-offset-2">
              admin guide
            </Link>
            .
          </p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="recent-title"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id="recent-title" className="text-lg font-semibold text-white">
              Latest audition applications
            </h3>
            <Link href="/admin/auditions" className="text-sm text-amber-100 hover:underline">
              View all ({totalApplications})
            </Link>
          </div>
          {recentApplications.length === 0 ? (
            <p className="mt-5 text-sm text-white/60">No applications yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {recentApplications.map((app) => (
                <li key={app.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{app.fullName}</p>
                    <p className="text-xs text-white/50">
                      {app.category.toLowerCase()} · {dateTime.format(app.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyle[app.status] ?? "bg-white/10 text-white/80"
                    }`}
                  >
                    {app.status.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="events-title"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id="events-title" className="text-lg font-semibold text-white">
              Upcoming events
            </h3>
            <Link href="/admin/events" className="text-sm text-amber-100 hover:underline">
              Manage events
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="mt-5 text-sm text-white/60">No upcoming events. Add one from Events.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{event.title}</p>
                    <p className="text-xs text-white/50">{dateTime.format(event.startsAt)}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      event.isPublished
                        ? "bg-emerald-300/15 text-emerald-100"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {event.isPublished ? "published" : "draft"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
