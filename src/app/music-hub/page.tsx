import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  ArrowRight,
  BookOpenText,
  Brain,
  Crown,
  FileMusic,
  Lightbulb,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { authOptions } from "@/auth";
import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import { getFeaturedAcademyArticle } from "@/lib/academy";
import { getPopularQuiz, getTodayDailyChallenge } from "@/lib/music-hub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Music Hub",
  description:
    "Learn, practice and compete with the Jude Nnam Chorale community: academy articles, daily theory challenges, quizzes, music challenges and the leaderboard.",
  alternates: { canonical: "https://www.jncchorale.com/music-hub" },
};

type Tile = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  accent: string;
  detail?: string | null;
};

export default async function MusicHubPage() {
  const [session, article, challenge, quiz] = await Promise.all([
    getServerSession(authOptions),
    getFeaturedAcademyArticle(),
    getTodayDailyChallenge(),
    getPopularQuiz(),
  ]);
  const isSignedIn = Boolean(session?.user?.id);

  const tiles: Tile[] = [
    {
      title: "Daily challenge",
      description: "One quick theory or ear-training question each day. Build a streak.",
      href: "/music-hub/daily-challenge",
      cta: "Play today's challenge",
      icon: Lightbulb,
      accent: "border-emerald-200/15 bg-emerald-200/8 text-emerald-100",
      detail: challenge?.title,
    },
    {
      title: "Quizzes",
      description: "Short quizzes on theory, ear training and choir basics, with instant results.",
      href: "/music-hub/quizzes",
      cta: "Browse quizzes",
      icon: Brain,
      accent: "border-cyan-200/15 bg-cyan-200/8 text-cyan-100",
      detail: quiz?.title,
    },
    {
      title: "Academy articles",
      description: "Readable guides on sight-reading, harmony, vocal health and rehearsal craft.",
      href: "/academy",
      cta: "Read articles",
      icon: BookOpenText,
      accent: "border-amber-200/15 bg-amber-200/8 text-amber-100",
      detail: article?.title,
    },
    {
      title: "Music challenges",
      description: "Submit a recording, vote for others and climb the challenge board.",
      href: "/music-hub/challenges",
      cta: "See challenges",
      icon: Trophy,
      accent: "border-violet-200/15 bg-violet-200/8 text-violet-100",
    },
    {
      title: "Leaderboard",
      description: "Weekly rankings from quizzes and daily challenges.",
      href: "/music-hub/leaderboard",
      cta: "View rankings",
      icon: Crown,
      accent: "border-rose-200/15 bg-rose-200/8 text-rose-100",
    },
    {
      title: "Scores bank",
      description: "Choir scores to download once you are signed in.",
      href: "/scores",
      cta: "Open scores",
      icon: FileMusic,
      accent: "border-sky-200/15 bg-sky-200/8 text-sky-100",
    },
  ];

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#08111f_52%,#101007_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:py-20">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">Music Hub</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Learn, practice, and return tomorrow stronger.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/68">
            Everything for growing as a musician, in one place. Explore for free, and
            sign in to save your progress and appear on the leaderboard.
          </p>
          {isSignedIn ? null : (
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                className="rounded-2xl bg-amber-300 font-semibold text-black hover:bg-amber-200"
                asChild
              >
                <Link href="/auth/register?callbackUrl=/music-hub">Create a free account</Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/auth/login?callbackUrl=/music-hub">Log in</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="group flex flex-col rounded-3xl border border-white/10 bg-white/4.5 p-6 transition hover:border-amber-200/28 hover:bg-white/[0.07]"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${tile.accent}`}
              >
                <tile.icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-white">{tile.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/62">{tile.description}</p>
              {tile.detail ? (
                <p className="mt-4 line-clamp-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/78">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/45">
                    Now:{" "}
                  </span>
                  {tile.detail}
                </p>
              ) : null}
              <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-amber-100">
                {tile.cta}
                <ArrowRight
                  className="h-4 w-4 transition group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
