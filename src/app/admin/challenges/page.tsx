import { Music2, Trophy, Upload, Vote } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import AdminChallengesClient from "./ui/admin-challenges-client";

function toDateTimeInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 16);
}

export default async function AdminChallengesPage() {
  const [challenges, submissions, totalVotes] = await Promise.all([
    prisma.challenge.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 200,
      include: {
        _count: {
          select: {
            submissions: true,
            votes: true,
          },
        },
      },
    }),
    prisma.challengeSubmission.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 240,
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    }),
    prisma.challengeVote.count(),
  ]);

  const publishedCount = challenges.filter((challenge) => challenge.isPublished).length;
  const pendingSubmissions = submissions.filter(
    (submission) => submission.status === "PENDING"
  ).length;
  const approvedSubmissions = submissions.filter(
    (submission) => submission.status === "APPROVED"
  ).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Music Challenges"
        title="Run public challenge prompts, submissions, and voting."
        description="Create vocal, instrumental, harmony, and sight-reading challenges. Moderate submitted recordings and track voting analytics from one workspace."
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="admin-stat-card min-h-0">
            <div className="flex items-center gap-2 text-sm text-white/68">
              <Trophy className="h-4 w-4 text-amber-100" />
              Challenges
            </div>
            <p className="admin-metric-value">{challenges.length}</p>
            <p className="text-sm admin-subtle">{publishedCount} published</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <div className="flex items-center gap-2 text-sm text-white/68">
              <Upload className="h-4 w-4 text-cyan-100" />
              Submissions
            </div>
            <p className="admin-metric-value">{submissions.length}</p>
            <p className="text-sm admin-subtle">{approvedSubmissions} approved</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <div className="flex items-center gap-2 text-sm text-white/68">
              <Music2 className="h-4 w-4 text-emerald-100" />
              Pending
            </div>
            <p className="admin-metric-value">{pendingSubmissions}</p>
            <p className="text-sm admin-subtle">Need moderation</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <div className="flex items-center gap-2 text-sm text-white/68">
              <Vote className="h-4 w-4 text-rose-100" />
              Votes
            </div>
            <p className="admin-metric-value">{totalVotes}</p>
            <p className="text-sm admin-subtle">One per user per challenge</p>
          </div>
        </div>
      </AdminPageHeader>

      <AdminChallengesClient
        initialChallenges={challenges.map((challenge) => ({
          id: challenge.id,
          title: challenge.title,
          slug: challenge.slug,
          type: challenge.type,
          description: challenge.description,
          prompt: challenge.prompt,
          rules: challenge.rules,
          coverImageUrl: challenge.coverImageUrl,
          coverImagePublicId: challenge.coverImagePublicId,
          startsAt: toDateTimeInputValue(challenge.startsAt),
          endsAt: toDateTimeInputValue(challenge.endsAt),
          isPublished: challenge.isPublished,
          createdAt: challenge.createdAt.toISOString(),
          updatedAt: challenge.updatedAt.toISOString(),
          submissionCount: challenge._count.submissions,
          voteCount: challenge._count.votes,
        }))}
        initialSubmissions={submissions.map((submission) => ({
          id: submission.id,
          challengeId: submission.challengeId,
          challengeTitle: submission.challenge.title,
          challengeSlug: submission.challenge.slug,
          challengeType: submission.challenge.type,
          title: submission.title,
          description: submission.description,
          mediaType: submission.mediaType,
          audioUrl: submission.audioUrl,
          videoUrl: submission.videoUrl,
          status: submission.status,
          adminNote: submission.adminNote,
          isWinner: submission.isWinner,
          createdAt: submission.createdAt.toISOString(),
          voteCount: submission._count.votes,
          user: submission.user,
        }))}
      />
    </div>
  );
}
