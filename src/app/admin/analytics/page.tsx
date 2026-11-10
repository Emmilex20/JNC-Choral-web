import Link from "next/link";

import { getAnalyticsReport, parseRange, REPORT_RANGES } from "@/lib/analytics-report";
import { AdminPageHeader } from "../_components/admin-page-header";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function Table({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { label: string; pageviews: number; visitors: number }[];
  empty: string;
}) {
  return (
    <section className="admin-section">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-white/60">{empty}</p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-white/45">
            <tr>
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 text-right font-medium">Views</th>
              <th className="pb-2 text-right font-medium">Visitors</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-white/10">
                <td className="max-w-[16rem] truncate py-2 pr-3 text-white/85">{row.label}</td>
                <td className="py-2 text-right tabular-nums text-white/85">{row.pageviews}</td>
                <td className="py-2 text-right tabular-nums text-white/60">{row.visitors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const days = parseRange(Array.isArray(params.days) ? params.days[0] : params.days);

  let report: Awaited<ReturnType<typeof getAnalyticsReport>> | null = null;
  try {
    report = await getAnalyticsReport(days);
  } catch (error) {
    console.error("[admin/analytics]", error);
  }

  const maxViews = report ? Math.max(1, ...report.daily.map((d) => d.pageviews)) : 1;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Privacy-friendly site statistics. No cookies, no IP addresses and no personal data are stored."
        actions={REPORT_RANGES.map((range) => (
          <Link
            key={range}
            href={`/admin/analytics?days=${range}`}
            aria-current={range === days ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              range === days
                ? "border-amber-200/40 bg-amber-200/15 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Last {range} days
          </Link>
        ))}
      />

      {!report ? (
        <section className="admin-section">
          <p className="text-sm text-white/70">
            Analytics could not be loaded. Make sure the latest database migration has been applied
            (npm run migrate:deploy).
          </p>
        </section>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="admin-stat-card min-h-0">
              <p className="text-sm text-white/68">Page views</p>
              <p className="admin-metric-value">{report.totalPageviews}</p>
            </div>
            <div className="admin-stat-card min-h-0">
              <p className="text-sm text-white/68">Visitors per day (avg)</p>
              <p className="admin-metric-value">{report.averageDailyVisitors}</p>
            </div>
            <div className="admin-stat-card min-h-0">
              <p className="text-sm text-white/68">Audition applications</p>
              <p className="admin-metric-value">{report.auditionSubmissions}</p>
            </div>
            <div className="admin-stat-card min-h-0">
              <p className="text-sm text-white/68">New sign-ups</p>
              <p className="admin-metric-value">{report.signups}</p>
            </div>
          </div>

          <section className="admin-section">
            <h3 className="text-lg font-semibold text-white">Page views per day</h3>
            <div
              className="mt-5 flex h-40 items-end gap-1"
              role="img"
              aria-label={`Bar chart of daily page views over the last ${report.days} days`}
            >
              {report.daily.map((d) => (
                <div
                  key={d.day}
                  title={`${d.day}: ${d.pageviews} views, ${d.visitors} visitors`}
                  className="flex-1 rounded-t bg-amber-300/80 hover:bg-amber-200"
                  style={{ height: `${Math.max(2, (d.pageviews / maxViews) * 100)}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-white/45">
              <span>{report.daily[0]?.day}</span>
              <span>{report.daily[report.daily.length - 1]?.day}</span>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Table title="Top pages" rows={report.pages} empty="No page views recorded yet." />
            <Table
              title="Where visitors come from"
              rows={report.referrers}
              empty="No outside referrers yet. Direct visits and your own site are not listed."
            />
          </div>

          <section className="admin-section">
            <h3 className="text-lg font-semibold text-white">Audition funnel</h3>
            <p className="mt-1 text-sm text-white/60">
              Unique visitors who reached each step. Someone who starts one day and finishes the
              next is counted once on each day.
            </p>
            <ol className="mt-5 grid gap-3">
              {report.funnel.map((step) => (
                <li
                  key={step.name}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                >
                  <span className="text-sm text-white/85">{step.label}</span>
                  <span className="text-right">
                    <span className="text-lg font-semibold tabular-nums text-white">
                      {step.visitors}
                    </span>
                    {step.fromPrevious !== null ? (
                      <span className="ml-3 text-xs text-white/50">
                        {step.fromPrevious}% of previous step
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="admin-section">
            <h3 className="text-lg font-semibold text-white">Music Hub activity</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="admin-stat-card min-h-0">
                <p className="text-sm text-white/68">Quizzes completed</p>
                <p className="admin-metric-value">{report.quizzes}</p>
              </div>
              <div className="admin-stat-card min-h-0">
                <p className="text-sm text-white/68">Daily challenges played</p>
                <p className="admin-metric-value">{report.dailyChallenges}</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
