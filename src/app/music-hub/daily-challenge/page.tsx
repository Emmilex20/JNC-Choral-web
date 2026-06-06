import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowUpRight, CalendarDays, Lightbulb, Sparkles } from "lucide-react";

import { authOptions } from "@/auth";
import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import {
  getDailyChallengeAttemptForUser,
  getLagosDateKey,
  getTodayDailyChallenge,
  parseOptions,
} from "@/lib/music-hub";
import DailyChallengeClient from "./ui/daily-challenge-client";

export const metadata: Metadata = {
  title: "Daily Theory Challenge",
  description:
    "Take the JNC daily music theory challenge with one focused multiple-choice question each day.",
  alternates: {
    canonical: "/music-hub/daily-challenge",
  },
  openGraph: {
    title: "JNC Daily Theory Challenge",
    description:
      "Build your music theory confidence with one JNC challenge every day.",
    url: "/music-hub/daily-challenge",
    images: ["/logo.svg"],
  },
};

function formatToday() {
  const dateKey = getLagosDateKey();
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function DailyChallengePage() {
  const [challenge, session] = await Promise.all([
    getTodayDailyChallenge(),
    getServerSession(authOptions),
  ]);
  const existingAttempt = challenge
    ? await getDailyChallengeAttemptForUser(challenge.id, session?.user?.id)
    : null;
  const options = challenge ? parseOptions(challenge.options) : [];

  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#08111f_52%,#101007_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
              <Lightbulb className="h-3.5 w-3.5" />
              Daily Theory Challenge
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              One question a day. Better musicianship over time.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Return daily for a focused music theory prompt designed for singers,
              instrumentalists, and worship musicians growing with JNC.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="#challenge"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-200/30 bg-amber-200 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-100"
              >
                Open today&apos;s challenge
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/music-hub/quizzes"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Browse quizzes
              </Link>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="mt-5 text-sm uppercase tracking-[0.22em] text-white/45">
              Today
            </p>
            <p className="mt-3 text-2xl font-semibold leading-tight">{formatToday()}</p>
            <p className="mt-3 text-sm leading-6 text-white/60">
              {challenge
                ? "A challenge is ready for today."
                : "The admin team has not published today's challenge yet."}
            </p>
          </aside>
        </div>
      </section>

      <section id="challenge" className="mx-auto max-w-5xl px-4 py-10 md:px-6 lg:py-14">
        {challenge && options.length >= 2 ? (
          <DailyChallengeClient
            challenge={{
              id: challenge.id,
              title: challenge.title,
              prompt: challenge.prompt,
              options,
              explanation: challenge.explanation,
            }}
            existingAttempt={
              existingAttempt
                ? {
                    id: existingAttempt.id,
                    selectedIndex: existingAttempt.selectedIndex,
                    isCorrect: existingAttempt.isCorrect,
                    completionTimeSeconds: existingAttempt.completionTimeSeconds,
                  }
                : null
            }
          />
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 text-center md:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-white">
              Today&apos;s challenge is loading into the academy.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/62">
              Check back soon. Once the admin team publishes a daily theory challenge, it will
              appear here automatically.
            </p>
            <Link
              href="/music-hub/quizzes"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Practice with quizzes
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
