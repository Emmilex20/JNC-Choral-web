import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Crown, Medal, Trophy } from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { getLeaderboardSnapshot } from "@/lib/gamification";

export const metadata: Metadata = {
  title: "Music Hub Leaderboard",
  description:
    "View weekly, monthly, and all-time JNC Music Hub rankings based on quiz scores, daily challenge scores, and participation.",
  alternates: {
    canonical: "/music-hub/leaderboard",
  },
  openGraph: {
    title: "JNC Music Hub Leaderboard",
    description:
      "Weekly, monthly, and all-time rankings for JNC quizzes and daily theory challenges.",
    url: "/music-hub/leaderboard",
    images: ["/logo.svg"],
  },
};

export const dynamic = "force-dynamic";

type Entry = Awaited<ReturnType<typeof getLeaderboardSnapshot>>["weekly"]["entries"][number];

function displayName(entry: Entry) {
  return entry.user.name || entry.user.email?.split("@")[0] || "JNC Member";
}

function rankIcon(rank: number | null) {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-100" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-cyan-100" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-emerald-100" />;
  return <Trophy className="h-5 w-5 text-white/42" />;
}

function LeaderboardTable({
  title,
  subtitle,
  entries,
}: {
  title: string;
  subtitle: string;
  entries: Entry[];
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/62">
            {subtitle}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1.5 text-xs font-semibold text-white/58">
          {entries.length} ranked
        </span>
      </div>

      <div className="mt-6 grid gap-3">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-black/24 p-4 md:grid-cols-[auto_1fr_auto] md:items-center"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                {rankIcon(entry.rank)}
              </span>
              <span className="text-2xl font-semibold text-white">#{entry.rank ?? "-"}</span>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <Image
                  src={entry.user.image ?? "/logo.svg"}
                  alt={displayName(entry)}
                  fill
                  sizes="48px"
                  className={entry.user.image ? "object-cover" : "object-contain p-2"}
                />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-white">{displayName(entry)}</h3>
                <p className="text-xs text-white/45">
                  {entry.quizAttempts} quiz attempt{entry.quizAttempts === 1 ? "" : "s"} /{" "}
                  {entry.dailyChallengeAttempts} daily challenge
                  {entry.dailyChallengeAttempts === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right sm:grid-cols-4 md:min-w-96">
              <div>
                <p className="text-xs text-white/42">Points</p>
                <p className="font-semibold text-white">{entry.points}</p>
              </div>
              <div>
                <p className="text-xs text-white/42">Quiz</p>
                <p className="font-semibold text-white">{entry.quizPoints}</p>
              </div>
              <div>
                <p className="text-xs text-white/42">Daily</p>
                <p className="font-semibold text-white">{entry.dailyChallengePoints}</p>
              </div>
              <div>
                <p className="text-xs text-white/42">Active</p>
                <p className="font-semibold text-white">{entry.participationPoints}</p>
              </div>
            </div>
          </article>
        ))}

        {entries.length === 0 ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-center">
            <Trophy className="mx-auto h-8 w-8 text-amber-100" />
            <h3 className="mt-4 text-xl font-semibold text-white">No rankings yet.</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-white/58">
              Rankings appear after signed-in members complete quizzes or daily challenges.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default async function LeaderboardPage() {
  const snapshot = await getLeaderboardSnapshot();

  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#08111f_52%,#101007_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
              <Trophy className="h-3.5 w-3.5" />
              Global Leaderboard
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Rankings for the JNC learning community.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Weekly, monthly, and all-time rankings are calculated from quiz scores, daily
              challenge scores, and consistent participation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/music-hub/quizzes"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-200/30 bg-amber-200 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-100"
              >
                Take a quiz
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/music-hub/daily-challenge"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Daily challenge
              </Link>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="mt-5 text-sm uppercase tracking-[0.22em] text-white/45">
              Current Week
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {snapshot.weekly.entries[0]?.points ?? 0}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Top weekly score so far.
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:px-6 lg:py-14">
        <LeaderboardTable
          title="Weekly rankings"
          subtitle={snapshot.weekly.periodKey}
          entries={snapshot.weekly.entries}
        />
        <LeaderboardTable
          title="Monthly rankings"
          subtitle={snapshot.monthly.periodKey}
          entries={snapshot.monthly.entries}
        />
        <LeaderboardTable
          title="All-time rankings"
          subtitle="All JNC Music Hub activity"
          entries={snapshot.allTime.entries}
        />
      </section>

      <SiteFooter />
    </main>
  );
}
