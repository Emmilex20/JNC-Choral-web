import type { Prisma } from "@prisma/client";

import { isMissingLearningTableError } from "@/lib/learning-errors";
import { prisma } from "@/lib/prisma";

export const leaderboardPeriods = ["WEEKLY", "MONTHLY", "ALL_TIME"] as const;
export type LeaderboardPeriod = (typeof leaderboardPeriods)[number];

export const achievementDefinitions = [
  {
    code: "CONSISTENT_ATTENDEE",
    title: "Consistent Attendee",
    description: "Shows up faithfully for JNC rehearsals and choir commitments.",
    icon: "🥉",
    accent: "amber",
  },
  {
    code: "PERFORMANCE_STAR",
    title: "Performance Star",
    description: "Builds a strong record of participation and performance readiness.",
    icon: "🥈",
    accent: "cyan",
  },
  {
    code: "MUSIC_THEORY_MASTER",
    title: "Music Theory Master",
    description: "Scores strongly across quizzes and daily theory challenges.",
    icon: "🥇",
    accent: "emerald",
  },
  {
    code: "CHORAL_EXCELLENCE",
    title: "Choral Excellence",
    description: "Combines learning, discipline, and consistent platform activity.",
    icon: "🏆",
    accent: "gold",
  },
  {
    code: "VOCAL_CHAMPION",
    title: "Vocal Champion",
    description: "Maintains an active verified voice-section profile.",
    icon: "🎤",
    accent: "rose",
  },
  {
    code: "INSTRUMENT_SPECIALIST",
    title: "Instrument Specialist",
    description: "Represents instrumental excellence within the JNC community.",
    icon: "🎹",
    accent: "blue",
  },
  {
    code: "SECTION_LEADER",
    title: "Section Leader",
    description: "Models consistency, learning, and reliable chorister commitment.",
    icon: "👑",
    accent: "purple",
  },
] as const;

type ScoreBucket = {
  userId: string;
  quizPoints: number;
  dailyChallengePoints: number;
  participationPoints: number;
  quizAttempts: number;
  dailyChallengeAttempts: number;
};

function startOfDayUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getIsoWeek(date: Date) {
  const target = startOfDayUtc(date);
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return {
    year: target.getUTCFullYear(),
    week: weekNumber,
  };
}

function getPeriodWindow(period: LeaderboardPeriod, now = new Date()) {
  if (period === "ALL_TIME") {
    return { key: "all-time", start: null, end: null };
  }

  if (period === "MONTHLY") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const key = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    return { key, start, end };
  }

  const day = now.getUTCDay() || 7;
  const start = startOfDayUtc(now);
  start.setUTCDate(start.getUTCDate() - day + 1);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  const iso = getIsoWeek(now);
  return {
    key: `${iso.year}-W${String(iso.week).padStart(2, "0")}`,
    start,
    end,
  };
}

function getDateFilter(start: Date | null, end: Date | null) {
  if (!start || !end) return {};
  return { createdAt: { gte: start, lt: end } };
}

function getQuizAttemptPoints(score: number, totalQuestions: number) {
  const perfectBonus = totalQuestions > 0 && score === totalQuestions ? 5 : 0;
  return score * 10 + perfectBonus;
}

function getDailyAttemptPoints(isCorrect: boolean) {
  return isCorrect ? 10 : 0;
}

function getOrCreateBucket(buckets: Map<string, ScoreBucket>, userId: string) {
  const existing = buckets.get(userId);
  if (existing) return existing;

  const bucket: ScoreBucket = {
    userId,
    quizPoints: 0,
    dailyChallengePoints: 0,
    participationPoints: 0,
    quizAttempts: 0,
    dailyChallengeAttempts: 0,
  };
  buckets.set(userId, bucket);
  return bucket;
}

async function listLeaderboardEntries(period: LeaderboardPeriod, periodKey: string, take: number) {
  return prisma.leaderboardEntry.findMany({
    where: { period, periodKey },
    orderBy: [{ rank: "asc" }, { points: "desc" }],
    take,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          isChorister: true,
          choristerVerified: true,
        },
      },
    },
  });
}

export async function syncLeaderboardPeriod(
  period: LeaderboardPeriod,
  now = new Date(),
  take = 20
) {
  const { key, start, end } = getPeriodWindow(period, now);
  const dateFilter = getDateFilter(start, end);

  try {
    const [quizAttempts, dailyAttempts] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: {
          userId: { not: null },
          ...dateFilter,
        },
        select: {
          userId: true,
          score: true,
          totalQuestions: true,
        },
      }),
      prisma.dailyChallengeAttempt.findMany({
        where: {
          userId: { not: null },
          ...dateFilter,
        },
        select: {
          userId: true,
          isCorrect: true,
        },
      }),
    ]);

    const buckets = new Map<string, ScoreBucket>();

    for (const attempt of quizAttempts) {
      if (!attempt.userId) continue;
      const bucket = getOrCreateBucket(buckets, attempt.userId);
      bucket.quizAttempts += 1;
      bucket.quizPoints += getQuizAttemptPoints(attempt.score, attempt.totalQuestions);
      bucket.participationPoints += 2;
    }

    for (const attempt of dailyAttempts) {
      if (!attempt.userId) continue;
      const bucket = getOrCreateBucket(buckets, attempt.userId);
      bucket.dailyChallengeAttempts += 1;
      bucket.dailyChallengePoints += getDailyAttemptPoints(attempt.isCorrect);
      bucket.participationPoints += 3;
    }

    const ranked = Array.from(buckets.values())
      .map((bucket) => ({
        ...bucket,
        points:
          bucket.quizPoints + bucket.dailyChallengePoints + bucket.participationPoints,
      }))
      .filter((bucket) => bucket.points > 0)
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.quizPoints - a.quizPoints ||
          b.dailyChallengePoints - a.dailyChallengePoints ||
          b.participationPoints - a.participationPoints
      );

    await prisma.$transaction(async (tx) => {
      await tx.leaderboardEntry.deleteMany({
        where: { period, periodKey: key },
      });

      for (const [index, bucket] of ranked.entries()) {
        await tx.leaderboardEntry.create({
          data: {
            userId: bucket.userId,
            period,
            periodKey: key,
            points: bucket.points,
            quizPoints: bucket.quizPoints,
            dailyChallengePoints: bucket.dailyChallengePoints,
            participationPoints: bucket.participationPoints,
            quizAttempts: bucket.quizAttempts,
            dailyChallengeAttempts: bucket.dailyChallengeAttempts,
            rank: index + 1,
          },
        });
      }
    });

    return {
      period,
      periodKey: key,
      entries: await listLeaderboardEntries(period, key, take),
    };
  } catch (error) {
    if (isMissingLearningTableError(error)) {
      return { period, periodKey: key, entries: [] };
    }
    throw error;
  }
}

export async function syncLeaderboards(now = new Date()) {
  const weekly = await syncLeaderboardPeriod("WEEKLY", now);
  const monthly = await syncLeaderboardPeriod("MONTHLY", now);
  const allTime = await syncLeaderboardPeriod("ALL_TIME", now);

  return { weekly, monthly, allTime };
}

export async function getLeaderboardSnapshot() {
  return syncLeaderboards();
}

export async function getLeaderboardPreview(take = 3) {
  const { key } = getPeriodWindow("WEEKLY");

  try {
    return await listLeaderboardEntries("WEEKLY", key, take);
  } catch (error) {
    if (isMissingLearningTableError(error)) return [];
    throw error;
  }
}

export async function ensureAchievements() {
  try {
    await Promise.all(
      achievementDefinitions.map((achievement) =>
        prisma.achievement.upsert({
          where: { code: achievement.code },
          create: achievement,
          update: {
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            accent: achievement.accent,
            isActive: true,
          },
        })
      )
    );
  } catch (error) {
    if (isMissingLearningTableError(error)) return;
    throw error;
  }
}

export async function awardAchievementsForUser(userId: string, source = "activity") {
  try {
    await ensureAchievements();

    const [user, quizAttempts, dailyAttempts, attendanceCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          isChorister: true,
          choristerVerified: true,
          choristerProfile: {
            select: { voicePart: true },
          },
          auditions: {
            select: {
              category: true,
              status: true,
            },
          },
        },
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        select: {
          score: true,
          totalQuestions: true,
        },
      }),
      prisma.dailyChallengeAttempt.findMany({
        where: { userId },
        select: { isCorrect: true },
      }),
      prisma.attendanceRecord.count({
        where: {
          userId,
          status: { in: ["PRESENT", "EXCUSED"] },
          OR: [{ confirmedAt: { not: null } }, { autoMarked: false }],
        },
      }),
    ]);

    if (!user) return [];

    const quizPoints = quizAttempts.reduce(
      (sum, attempt) => sum + getQuizAttemptPoints(attempt.score, attempt.totalQuestions),
      0
    );
    const quizPerfects = quizAttempts.filter(
      (attempt) => attempt.totalQuestions > 0 && attempt.score === attempt.totalQuestions
    ).length;
    const dailyCorrect = dailyAttempts.filter((attempt) => attempt.isCorrect).length;
    const dailyPoints = dailyCorrect * 10;
    const participationPoints = quizAttempts.length * 2 + dailyAttempts.length * 3;
    const totalLearningPoints = quizPoints + dailyPoints + participationPoints;
    const learningAttempts = quizAttempts.length + dailyAttempts.length;
    const acceptedInstrumentalist = user.auditions.some(
      (application) =>
        application.category === "INSTRUMENTALIST" && application.status === "ACCEPTED"
    );

    const awardedCodes = new Set<string>();
    if (attendanceCount >= 4) awardedCodes.add("CONSISTENT_ATTENDEE");
    if (attendanceCount >= 8) awardedCodes.add("PERFORMANCE_STAR");
    if (totalLearningPoints >= 120 || quizPerfects >= 3 || dailyCorrect >= 7) {
      awardedCodes.add("MUSIC_THEORY_MASTER");
    }
    if (totalLearningPoints >= 220 || (attendanceCount >= 8 && learningAttempts >= 8)) {
      awardedCodes.add("CHORAL_EXCELLENCE");
    }
    if (user.choristerProfile?.voicePart && attendanceCount >= 3) {
      awardedCodes.add("VOCAL_CHAMPION");
    }
    if (acceptedInstrumentalist || (totalLearningPoints >= 80 && quizAttempts.length >= 3)) {
      awardedCodes.add("INSTRUMENT_SPECIALIST");
    }
    if (user.choristerVerified && attendanceCount >= 10 && learningAttempts >= 5) {
      awardedCodes.add("SECTION_LEADER");
    }

    const achievements = await prisma.achievement.findMany({
      where: { code: { in: Array.from(awardedCodes) }, isActive: true },
      select: { id: true, code: true },
    });

    await Promise.all(
      achievements.map((achievement) =>
        prisma.userAchievement.upsert({
          where: {
            userId_achievementId: {
              userId,
              achievementId: achievement.id,
            },
          },
          create: {
            userId,
            achievementId: achievement.id,
            source,
            metadata: {
              totalLearningPoints,
              attendanceCount,
              learningAttempts,
            } satisfies Prisma.InputJsonValue,
          },
          update: {},
        })
      )
    );

    return achievements.map((achievement) => achievement.code);
  } catch (error) {
    if (isMissingLearningTableError(error)) return [];
    throw error;
  }
}

export async function updateGamificationForUser(userId: string, source = "activity") {
  try {
    await syncLeaderboards();
    return awardAchievementsForUser(userId, source);
  } catch (error) {
    if (isMissingLearningTableError(error)) return [];
    throw error;
  }
}

export async function getUserGamificationSummary(userId: string) {
  try {
    await updateGamificationForUser(userId, "profile-view");

    const [allTimeEntry, badges, quizHistory] = await Promise.all([
      prisma.leaderboardEntry.findUnique({
        where: {
          userId_period_periodKey: {
            userId,
            period: "ALL_TIME",
            periodKey: "all-time",
          },
        },
        select: {
          points: true,
          rank: true,
          quizPoints: true,
          dailyChallengePoints: true,
          participationPoints: true,
        },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { awardedAt: "desc" },
        select: {
          awardedAt: true,
          achievement: {
            select: {
              code: true,
              title: true,
              description: true,
              icon: true,
              accent: true,
            },
          },
        },
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          score: true,
          totalQuestions: true,
          completionTimeSeconds: true,
          createdAt: true,
          quiz: {
            select: {
              title: true,
              slug: true,
              category: true,
            },
          },
        },
      }),
    ]);

    return {
      totalPoints: allTimeEntry?.points ?? 0,
      rank: allTimeEntry?.rank ?? null,
      quizPoints: allTimeEntry?.quizPoints ?? 0,
      dailyChallengePoints: allTimeEntry?.dailyChallengePoints ?? 0,
      participationPoints: allTimeEntry?.participationPoints ?? 0,
      badges: badges.map((badge) => ({
        ...badge.achievement,
        awardedAt: badge.awardedAt,
      })),
      quizHistory,
    };
  } catch (error) {
    if (isMissingLearningTableError(error)) {
      return {
        totalPoints: 0,
        rank: null,
        quizPoints: 0,
        dailyChallengePoints: 0,
        participationPoints: 0,
        badges: [],
        quizHistory: [],
      };
    }
    throw error;
  }
}

export function getAchievementShowcase() {
  return achievementDefinitions.slice(0, 4);
}
