import type { Prisma } from "@prisma/client";

import { createContentSlug, isMissingLearningTableError } from "@/lib/learning-errors";
import { prisma } from "@/lib/prisma";

export const challengeTypes = [
  "Vocal Challenge",
  "Instrument Challenge",
  "Harmony Challenge",
  "Sight Reading Challenge",
] as const;

export const challengeSubmissionStatuses = ["PENDING", "APPROVED", "REJECTED"] as const;
export const challengeMediaTypes = ["TEXT", "AUDIO", "VIDEO"] as const;

export type ChallengeType = (typeof challengeTypes)[number];
export type ChallengeSubmissionStatus = (typeof challengeSubmissionStatuses)[number];
export type ChallengeMediaType = (typeof challengeMediaTypes)[number];

export const publicChallengeSelect = {
  id: true,
  title: true,
  slug: true,
  type: true,
  description: true,
  prompt: true,
  rules: true,
  coverImageUrl: true,
  sightReadingExercise: true,
  startsAt: true,
  endsAt: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      submissions: true,
      votes: true,
    },
  },
} satisfies Prisma.ChallengeSelect;

export type PublicChallenge = Prisma.ChallengeGetPayload<{
  select: typeof publicChallengeSelect;
}>;

export const publicSubmissionSelect = {
  id: true,
  challengeId: true,
  userId: true,
  title: true,
  description: true,
  mediaType: true,
  audioUrl: true,
  videoUrl: true,
  isWinner: true,
  createdAt: true,
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
} satisfies Prisma.ChallengeSubmissionSelect;

export type PublicChallengeSubmission = Prisma.ChallengeSubmissionGetPayload<{
  select: typeof publicSubmissionSelect;
}>;

function activeChallengeWhere(now = new Date()): Prisma.ChallengeWhereInput {
  return {
    isPublished: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
}

export function formatChallengeWindow(challenge: {
  startsAt: Date | null;
  endsAt: Date | null;
}) {
  if (!challenge.startsAt && !challenge.endsAt) return "Open challenge";

  const formatter = new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (challenge.startsAt && challenge.endsAt) {
    return `${formatter.format(challenge.startsAt)} - ${formatter.format(challenge.endsAt)}`;
  }

  if (challenge.startsAt) return `Opens ${formatter.format(challenge.startsAt)}`;
  return `Closes ${formatter.format(challenge.endsAt!)}`;
}

export function submissionDisplayName(submission: PublicChallengeSubmission) {
  return (
    submission.user?.name ||
    submission.user?.email?.split("@")[0] ||
    "JNC participant"
  );
}

export async function getUniqueChallengeSlug(title: string, id?: string) {
  const base = createContentSlug(title, "challenge");
  let candidate = base;
  let suffix = 2;

  while (
    await prisma.challenge.findFirst({
      where: {
        slug: candidate,
        ...(id ? { NOT: { id } } : {}),
      },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function getChallengesIndexData(userId?: string | null) {
  const now = new Date();

  try {
    const [challenges, topSubmissions, performerPool, currentUserVotes] =
      await Promise.all([
        prisma.challenge.findMany({
          where: activeChallengeWhere(now),
          orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
          take: 24,
          select: publicChallengeSelect,
        }),
        prisma.challengeSubmission.findMany({
          where: {
            status: "APPROVED",
            challenge: activeChallengeWhere(now),
          },
          orderBy: [{ votes: { _count: "desc" } }, { createdAt: "desc" }],
          take: 8,
          select: {
            ...publicSubmissionSelect,
            challenge: {
              select: {
                title: true,
                slug: true,
                type: true,
              },
            },
          },
        }),
        prisma.challengeSubmission.findMany({
          where: {
            status: "APPROVED",
            userId: { not: null },
            challenge: { isPublished: true },
          },
          orderBy: [{ votes: { _count: "desc" } }, { createdAt: "desc" }],
          take: 150,
          select: {
            id: true,
            userId: true,
            isWinner: true,
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
        userId
          ? prisma.challengeVote.findMany({
              where: { userId },
              select: { challengeId: true, submissionId: true },
            })
          : Promise.resolve([]),
      ]);

    const performers = Array.from(
      performerPool.reduce(
        (map, submission) => {
          if (!submission.userId) return map;
          const existing = map.get(submission.userId) ?? {
            userId: submission.userId,
            name: submission.user?.name || submission.user?.email?.split("@")[0] || "JNC participant",
            image: submission.user?.image ?? null,
            votes: 0,
            submissions: 0,
            wins: 0,
          };

          existing.votes += submission._count.votes;
          existing.submissions += 1;
          existing.wins += submission.isWinner ? 1 : 0;
          map.set(submission.userId, existing);
          return map;
        },
        new Map<
          string,
          {
            userId: string;
            name: string;
            image: string | null;
            votes: number;
            submissions: number;
            wins: number;
          }
        >()
      ).values()
    )
      .sort((a, b) => b.votes - a.votes || b.wins - a.wins || b.submissions - a.submissions)
      .slice(0, 8)
      .map((performer, index) => ({ ...performer, rank: index + 1 }));

    return { challenges, topSubmissions, performers, currentUserVotes };
  } catch (error) {
    if (isMissingLearningTableError(error)) {
      return {
        challenges: [],
        topSubmissions: [],
        performers: [],
        currentUserVotes: [],
      };
    }
    throw error;
  }
}

export async function getChallengeBySlug(slug: string, userId?: string | null) {
  const now = new Date();

  try {
    const challenge = await prisma.challenge.findFirst({
      where: {
        slug,
        ...activeChallengeWhere(now),
      },
      select: {
        ...publicChallengeSelect,
        submissions: {
          where: { status: "APPROVED" },
          orderBy: [{ votes: { _count: "desc" } }, { createdAt: "desc" }],
          select: publicSubmissionSelect,
        },
      },
    });

    if (!challenge) return null;

    const currentVote = userId
      ? await prisma.challengeVote.findUnique({
          where: {
            challengeId_userId: {
              challengeId: challenge.id,
              userId,
            },
          },
          select: { submissionId: true },
        })
      : null;

    return { challenge, currentVote };
  } catch (error) {
    if (isMissingLearningTableError(error)) return null;
    throw error;
  }
}

export async function getUserChallengeStats(userId: string) {
  try {
    const [entries, wins, voteRows] = await Promise.all([
      prisma.challengeSubmission.count({ where: { userId } }),
      prisma.challengeSubmission.count({ where: { userId, isWinner: true } }),
      prisma.challengeSubmission.findMany({
        where: {
          status: "APPROVED",
          userId: { not: null },
        },
        select: {
          userId: true,
          isWinner: true,
          _count: {
            select: { votes: true },
          },
        },
        take: 1000,
      }),
    ]);

    const ranked = Array.from(
      voteRows.reduce((map, row) => {
        if (!row.userId) return map;
        const current = map.get(row.userId) ?? { userId: row.userId, votes: 0, wins: 0 };
        current.votes += row._count.votes;
        current.wins += row.isWinner ? 1 : 0;
        map.set(row.userId, current);
        return map;
      }, new Map<string, { userId: string; votes: number; wins: number }>())
    )
      .map(([, value]) => value)
      .sort((a, b) => b.votes - a.votes || b.wins - a.wins);

    const own = ranked.find((entry) => entry.userId === userId);

    return {
      entries,
      wins,
      votes: own?.votes ?? 0,
      rank: own ? ranked.findIndex((entry) => entry.userId === userId) + 1 : null,
    };
  } catch (error) {
    if (isMissingLearningTableError(error)) {
      return { entries: 0, wins: 0, votes: 0, rank: null };
    }
    throw error;
  }
}

export async function listPublishedChallengesForSitemap() {
  try {
    return await prisma.challenge.findMany({
      where: { isPublished: true },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        slug: true,
        updatedAt: true,
      },
      take: 500,
    });
  } catch (error) {
    if (isMissingLearningTableError(error)) return [];
    throw error;
  }
}
