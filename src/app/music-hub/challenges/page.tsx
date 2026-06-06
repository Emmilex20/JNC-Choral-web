import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  MicVocal,
  Music2,
  PlayCircle,
  Trophy,
  UsersRound,
  Vote,
  Waves,
} from "lucide-react";

import { authOptions } from "@/auth";
import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  challengeTypes,
  formatChallengeWindow,
  getChallengesIndexData,
} from "@/lib/challenges";
import { getServerSession } from "next-auth";

export const metadata: Metadata = {
  title: "Music Challenges",
  description:
    "Join JNC vocal, instrumental, harmony, and sight reading challenges. Submit audio, video, or text entries and vote for standout performers.",
  alternates: {
    canonical: "/music-hub/challenges",
  },
};

export const dynamic = "force-dynamic";

const typeIcons = [MicVocal, Music2, Waves, PlayCircle] as const;

function performerInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function MusicChallengesPage() {
  const session = await getServerSession(authOptions);
  const { challenges, topSubmissions, performers } = await getChallengesIndexData(
    session?.user?.id
  );

  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#08111f_52%,#101007_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
              <Trophy className="h-3.5 w-3.5" />
              Music Challenges
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Discover JNC challenges, submit when open, and rise through the board.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Explore published vocal, instrumental, harmony, and sight-reading prompts.
              When entries are open, upload audio or video and let the community recognize
              standout work.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button className="rounded-2xl bg-amber-200 px-6 py-6 text-black hover:bg-amber-100" asChild>
                <a href="#open-challenges">
                  Browse challenges
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/[0.05] px-6 py-6 text-white hover:bg-white/[0.09]"
                asChild
              >
                <a href="#challenge-leaderboard">Challenge leaderboard</a>
              </Button>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6">
            <div className="grid grid-cols-2 gap-3">
              {challengeTypes.map((type, index) => {
                const Icon = typeIcons[index] ?? Trophy;
                return (
                  <div key={type} className="rounded-2xl border border-white/10 bg-black/24 p-4">
                    <Icon className="h-5 w-5 text-amber-100" />
                    <p className="mt-3 text-sm font-semibold text-white">{type}</p>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </section>

      <section id="open-challenges" className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/62">
              Published Challenges
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Choose your next prompt
            </h2>
          </div>
          <Badge className="w-fit rounded-full bg-white/10 text-white hover:bg-white/10">
            {challenges.length} published
          </Badge>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {challenges.map((challenge) => (
            <Link
              key={challenge.id}
              href={`/music-hub/challenges/${challenge.slug}`}
              className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] transition hover:border-amber-200/28 hover:bg-white/[0.07]"
            >
              <div className="relative h-56 bg-black">
                {challenge.coverImageUrl ? (
                  <Image
                    src={challenge.coverImageUrl}
                    alt={challenge.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(34,211,238,0.11))]">
                    <Trophy className="h-14 w-14 text-amber-100" />
                  </div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.74))]" />
                <div className="absolute bottom-5 left-5 right-5">
                  <Badge className="rounded-full bg-amber-200/12 text-amber-50 hover:bg-amber-200/12">
                    {challenge.type}
                  </Badge>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{challenge.title}</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="line-clamp-3 text-sm leading-7 text-white/62">
                  {challenge.description ?? challenge.prompt ?? "Open for JNC submissions."}
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/58">
                  <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1.5">
                    {formatChallengeWindow(challenge)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1.5">
                    {challenge._count.votes} votes
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1.5">
                    {challenge._count.submissions} entries
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {challenges.length === 0 ? (
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-8 text-center md:col-span-2 xl:col-span-3">
              <Trophy className="mx-auto h-9 w-9 text-amber-100" />
              <h3 className="mt-4 text-2xl font-semibold text-white">No published challenges yet.</h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/62">
                New music challenges will appear here when the admin team publishes them.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section id="challenge-leaderboard" className="border-y border-white/10 bg-[#07110f]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 md:p-7">
            <div className="flex items-center gap-3">
              <Vote className="h-6 w-6 text-amber-100" />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Most Voted</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Submission leaderboard</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {topSubmissions.map((submission, index) => (
                <Link
                  key={submission.id}
                  href={`/music-hub/challenges/${submission.challenge.slug}`}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-black/24 p-4 transition hover:border-amber-200/24 hover:bg-white/[0.06] sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <span className="text-2xl font-semibold text-amber-100">#{index + 1}</span>
                  <div>
                    <p className="font-semibold text-white">
                      {submission.title || submission.challenge.title}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/42">
                      {submission.challenge.type}
                    </p>
                  </div>
                  <strong className="text-xl text-white">{submission._count.votes}</strong>
                </Link>
              ))}
              {topSubmissions.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/58">
                  Approved submissions will appear here once voting begins.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 md:p-7">
            <div className="flex items-center gap-3">
              <UsersRound className="h-6 w-6 text-cyan-100" />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Top Performers
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Community ranking</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {performers.map((performer) => (
                <div
                  key={performer.userId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/24 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-white">
                      {performer.image ? (
                        <Image
                          src={performer.image}
                          alt={performer.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        performerInitials(performer.name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        #{performer.rank} {performer.name}
                      </p>
                      <p className="text-xs text-white/45">
                        {performer.submissions} entries / {performer.wins} wins
                      </p>
                    </div>
                  </div>
                  <strong className="text-lg text-amber-100">{performer.votes}</strong>
                </div>
              ))}
              {performers.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/58">
                  Performer rankings will appear after approved entries receive votes.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
