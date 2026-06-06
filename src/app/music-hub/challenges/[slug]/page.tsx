import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, CalendarDays, Trophy } from "lucide-react";

import { authOptions } from "@/auth";
import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { Badge } from "@/components/ui/badge";
import {
  formatChallengeWindow,
  getChallengeBySlug,
  isChallengeAcceptingEntries,
} from "@/lib/challenges";
import { normalizeSightReadingExercise } from "@/lib/sight-reading";
import ChallengeDetailClient from "../ui/challenge-detail-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getChallengeBySlug(slug);

  if (!data) {
    return {
      title: "Music Challenge",
    };
  }

  return {
    title: data.challenge.title,
    description:
      data.challenge.description ??
      data.challenge.prompt ??
      "Join this JNC music challenge and submit your performance.",
    alternates: {
      canonical: `/music-hub/challenges/${data.challenge.slug}`,
    },
  };
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, session] = await Promise.all([params, getServerSession(authOptions)]);
  const data = await getChallengeBySlug(slug, session?.user?.id);

  if (!data) notFound();

  const { challenge, currentVote } = data;

  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#08111f_52%,#101007_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:py-16">
          <Link
            href="/music-hub/challenges"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/62 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to challenges
          </Link>
          <div className="mt-8 flex flex-wrap gap-2">
            <Badge className="rounded-full bg-amber-200/12 text-amber-50 hover:bg-amber-200/12">
              <Trophy className="h-3.5 w-3.5" />
              {challenge.type}
            </Badge>
            <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatChallengeWindow(challenge)}
            </Badge>
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {challenge.title}
          </h1>
          {challenge.description ? (
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              {challenge.description}
            </p>
          ) : null}
        </div>
      </section>

      <ChallengeDetailClient
        challenge={{
          id: challenge.id,
          title: challenge.title,
          slug: challenge.slug,
          type: challenge.type,
          description: challenge.description,
          prompt: challenge.prompt,
          rules: challenge.rules,
          coverImageUrl: challenge.coverImageUrl,
          sightReadingExercise: normalizeSightReadingExercise(challenge.sightReadingExercise),
          startsAt: challenge.startsAt?.toISOString() ?? null,
          endsAt: challenge.endsAt?.toISOString() ?? null,
        }}
        submissions={challenge.submissions.map((submission) => ({
          id: submission.id,
          userId: submission.userId,
          title: submission.title,
          description: submission.description,
          mediaType: submission.mediaType,
          audioUrl: submission.audioUrl,
          videoUrl: submission.videoUrl,
          isWinner: submission.isWinner,
          createdAt: submission.createdAt.toISOString(),
          voteCount: submission._count.votes,
          user: submission.user,
        }))}
        isSignedIn={Boolean(session?.user?.id)}
        isAcceptingEntries={isChallengeAcceptingEntries(challenge)}
        currentUserId={session?.user?.id ?? null}
        currentVoteSubmissionId={currentVote?.submissionId ?? null}
      />

      <SiteFooter />
    </main>
  );
}
