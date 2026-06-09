import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowUpRight, Download, FileText, Lock, Search } from "lucide-react";

import { authOptions } from "@/auth";
import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { listPublicScoreSheets } from "@/lib/music-sheets";
import { jncEntityKeywords, scoreKeywords, songKeywords, uniqueKeywords } from "@/lib/seo-keywords";

export const metadata: Metadata = {
  title: "Sir Jude Nnam Scores Bank",
  description:
    "Browse Sir Jude Nnam sheet music, liturgical scores, gospel arrangements, and JNC score files. Register or sign in to download scores.",
  alternates: {
    canonical: "/scores",
  },
  keywords: uniqueKeywords(jncEntityKeywords, scoreKeywords, songKeywords, [
    "JNC Scores Bank",
    "Sir Jude Nnam Scores Bank",
    "Jude Nnam liturgical scores",
    "Jude Nnam gospel arrangements",
  ]),
  openGraph: {
    title: "Sir Jude Nnam Scores Bank",
    description:
      "Browse Sir Jude Nnam sheet music and JNC score files. Register or sign in to download scores.",
    url: "/scores",
    images: ["/logo.svg"],
  },
};

function scoreTitle(score: { title: string | null; fileName: string }) {
  return score.title ?? score.fileName;
}

export default async function ScoresPage() {
  const [scores, session] = await Promise.all([
    listPublicScoreSheets(),
    getServerSession(authOptions),
  ]);
  const isSignedIn = Boolean(session?.user?.id);

  return (
    <main className="min-h-screen bg-[#02040a]">
      <SiteNavbar />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(4,7,18,0.98),rgba(10,16,31,0.9))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-center lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-100/70">
              JNC Scores Bank
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Sir Jude Nnam sheet music and choral scores.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
              Explore published scores from the Jude Nnam Chorale archive. Each score page is public
              for discovery, while score files are available to registered members.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={isSignedIn ? "#available-scores" : "/auth/register?callbackUrl=/scores"}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-200/30 bg-amber-200 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-100"
              >
                {isSignedIn ? "Browse Score Archive" : "Create Account to Download"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href={isSignedIn ? "/profile" : "/auth/login?callbackUrl=/scores"}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {isSignedIn ? "Account Center" : "Member Sign In"}
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
            <div className="relative mx-auto h-36 w-36 overflow-hidden rounded-[2rem] border border-amber-200/20 bg-black/30">
              <Image src="/logo.svg" alt="JNC logo" fill sizes="144px" className="object-cover" />
            </div>
            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <p className="text-sm text-white/62">Published scores</p>
                <p className="mt-2 text-4xl font-semibold text-white">{scores.length}</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200/15 bg-amber-200/8 p-4 text-sm leading-6 text-amber-50/86">
                {isSignedIn ? (
                  <Download className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                {isSignedIn
                  ? "You are signed in. Open any score page to download available files."
                  : "Public browsing is open. Downloads unlock after registration."}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="available-scores" className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/52">
              <Search className="h-3.5 w-3.5" />
              Browse Archive
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-white">Available scores</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/62">
            {isSignedIn
              ? "Open a score page to review details, then download the available file from your account."
              : "Search engines can index these score titles and descriptions. Download access remains protected for registered users."}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scores.map((score) => (
            <Link
              key={score.id}
              href={`/scores/${score.slug}`}
              className="group rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1 text-xs text-white/62">
                  {score.mimeType?.includes("pdf") ? "PDF" : "Score"}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">
                {scoreTitle(score)}
              </h3>
              <p className="mt-2 text-sm text-white/60">{score.composer}</p>
              {score.description ? (
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/68">
                  {score.description}
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2">
                {score.voicing ? (
                  <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1 text-xs text-white/64">
                    {score.voicing}
                  </span>
                ) : null}
                {score.lyricsLanguage ? (
                  <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1 text-xs text-white/64">
                    {score.lyricsLanguage}
                  </span>
                ) : null}
                {score.scoreKey ? (
                  <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1 text-xs text-white/64">
                    Key: {score.scoreKey}
                  </span>
                ) : null}
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                View score
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        {scores.length === 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/62">
            No scores have been published yet. Check back soon.
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}
