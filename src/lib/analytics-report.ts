import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const REPORT_RANGES = [7, 30, 90] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

export function parseRange(value: unknown): ReportRange {
  const n = Number(value);
  return (REPORT_RANGES as readonly number[]).includes(n) ? (n as ReportRange) : 30;
}

export type DayRow = { day: string; pageviews: number; visitors: number };

/** Lagos calendar day (YYYY-MM-DD) for a date. */
export function lagosDay(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Returns one row per day for the last `days` days, with zeros where there is no data. */
export function fillDays(rows: DayRow[], days: number, now = new Date()): DayRow[] {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const result: DayRow[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = lagosDay(new Date(now.getTime() - offset * 24 * 60 * 60 * 1000));
    result.push(byDay.get(day) ?? { day, pageviews: 0, visitors: 0 });
  }
  return result;
}

export type FunnelStep = {
  name: string;
  label: string;
  visitors: number;
  /** Share of the previous step, or null for the first step. */
  fromPrevious: number | null;
};

const FUNNEL = [
  ["audition_form_view", "Opened the audition form"],
  ["audition_step_2", "Finished step 1 (About you)"],
  ["audition_step_3", "Finished step 2 (Your craft)"],
  ["audition_submitted", "Submitted the application"],
] as const;

export function buildFunnel(counts: Record<string, number>): FunnelStep[] {
  return FUNNEL.map(([name, label], index) => {
    const visitors = counts[name] ?? 0;
    const previous = index === 0 ? null : (counts[FUNNEL[index - 1][0]] ?? 0);
    return {
      name,
      label,
      visitors,
      fromPrevious:
        previous === null ? null : previous === 0 ? 0 : Math.round((visitors / previous) * 100),
    };
  });
}

type CountRow = { label: string; pageviews: number; visitors: number };

export async function getAnalyticsReport(days: ReportRange) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [dailyRows, pages, referrers, events] = await Promise.all([
    prisma.$queryRaw<DayRow[]>(Prisma.sql`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Lagos', 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS pageviews,
             COUNT(DISTINCT visitor)::int AS visitors
      FROM "AnalyticsEvent"
      WHERE name = 'pageview' AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1`),
    prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT path AS label, COUNT(*)::int AS pageviews, COUNT(DISTINCT visitor)::int AS visitors
      FROM "AnalyticsEvent"
      WHERE name = 'pageview' AND "createdAt" >= ${since}
      GROUP BY path ORDER BY pageviews DESC LIMIT 10`),
    prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT referrer AS label, COUNT(*)::int AS pageviews, COUNT(DISTINCT visitor)::int AS visitors
      FROM "AnalyticsEvent"
      WHERE name = 'pageview' AND referrer IS NOT NULL AND "createdAt" >= ${since}
      GROUP BY referrer ORDER BY pageviews DESC LIMIT 8`),
    prisma.$queryRaw<{ name: string; events: number; visitors: number }[]>(Prisma.sql`
      SELECT name, COUNT(*)::int AS events, COUNT(DISTINCT visitor)::int AS visitors
      FROM "AnalyticsEvent"
      WHERE name <> 'pageview' AND "createdAt" >= ${since}
      GROUP BY name`),
  ]);

  const daily = fillDays(dailyRows, days);
  const totalPageviews = daily.reduce((sum, row) => sum + row.pageviews, 0);
  const totalDailyVisitors = daily.reduce((sum, row) => sum + row.visitors, 0);
  const visitorCounts = Object.fromEntries(events.map((e) => [e.name, e.visitors]));
  const eventCounts = Object.fromEntries(events.map((e) => [e.name, e.events]));

  return {
    days,
    daily,
    totalPageviews,
    averageDailyVisitors: Math.round(totalDailyVisitors / days),
    pages,
    referrers,
    funnel: buildFunnel(visitorCounts),
    signups: eventCounts["signup_completed"] ?? 0,
    quizzes: eventCounts["quiz_completed"] ?? 0,
    dailyChallenges: eventCounts["daily_challenge_played"] ?? 0,
    auditionSubmissions: eventCounts["audition_submitted"] ?? 0,
  };
}
