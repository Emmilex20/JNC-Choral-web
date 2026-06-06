import { Prisma } from "@prisma/client";

import { createContentSlug, isMissingLearningTableError } from "@/lib/learning-errors";
import { prisma } from "@/lib/prisma";

export const quizCategories = [
  "Beginner Music",
  "Choral Knowledge",
  "Worship Music",
  "Instrumental Knowledge",
] as const;

export const quizCardSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  category: true,
  isPopular: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      questions: true,
      attempts: true,
    },
  },
} satisfies Prisma.QuizSelect;

export const quizDetailSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  category: true,
  isPopular: true,
  createdAt: true,
  questions: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      prompt: true,
      options: true,
      order: true,
    },
  },
} satisfies Prisma.QuizSelect;

export type QuizCard = Prisma.QuizGetPayload<{ select: typeof quizCardSelect }>;
export type QuizDetail = Prisma.QuizGetPayload<{ select: typeof quizDetailSelect }>;

export const dailyChallengeSelect = {
  id: true,
  challengeDate: true,
  title: true,
  prompt: true,
  options: true,
  explanation: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DailyChallengeSelect;

export type DailyChallengeForPlay = Prisma.DailyChallengeGetPayload<{
  select: typeof dailyChallengeSelect;
}>;

export function getLagosDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

export function dateKeyToUtcDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function dateToDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((option): option is string => typeof option === "string");
}

export async function getUniqueQuizSlug(title: string, id?: string) {
  const base = createContentSlug(title, "quiz");
  let candidate = base;
  let suffix = 2;

  while (
    await prisma.quiz.findFirst({
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

export async function listPublishedQuizzes(category?: string) {
  try {
    return await prisma.quiz.findMany({
      where: {
        isPublished: true,
        ...(category ? { category } : {}),
      },
      orderBy: [{ isPopular: "desc" }, { createdAt: "desc" }],
      take: 40,
      select: quizCardSelect,
    });
  } catch (error) {
    if (isMissingLearningTableError(error)) return [];
    throw error;
  }
}

export async function getQuizForPlay(slug: string) {
  try {
    return await prisma.quiz.findFirst({
      where: { slug, isPublished: true },
      select: quizDetailSelect,
    });
  } catch (error) {
    if (isMissingLearningTableError(error)) return null;
    throw error;
  }
}

export async function getQuizAttemptForResults(attemptId: string) {
  try {
    return await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        score: true,
        totalQuestions: true,
        completionTimeSeconds: true,
        answers: true,
        createdAt: true,
        quiz: {
          select: {
            title: true,
            slug: true,
            category: true,
            questions: {
              orderBy: { order: "asc" },
              select: {
                prompt: true,
                options: true,
                correctIndex: true,
                explanation: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    if (isMissingLearningTableError(error)) return null;
    throw error;
  }
}

export async function getPopularQuiz() {
  try {
    return await prisma.quiz.findFirst({
      where: { isPublished: true },
      orderBy: [{ isPopular: "desc" }, { createdAt: "desc" }],
      select: quizCardSelect,
    });
  } catch (error) {
    if (isMissingLearningTableError(error)) return null;
    throw error;
  }
}

export async function listPublishedQuizzesForSitemap() {
  try {
    return await prisma.quiz.findMany({
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

export async function getTodayDailyChallenge() {
  const dateKey = getLagosDateKey();

  try {
    return await prisma.dailyChallenge.findFirst({
      where: {
        challengeDate: dateKeyToUtcDate(dateKey),
        isPublished: true,
      },
      select: dailyChallengeSelect,
    });
  } catch (error) {
    if (isMissingLearningTableError(error)) return null;
    throw error;
  }
}

export async function getDailyChallengeAttemptForUser(
  challengeId: string,
  userId?: string | null
) {
  if (!userId) return null;

  try {
    return await prisma.dailyChallengeAttempt.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
      select: {
        id: true,
        selectedIndex: true,
        isCorrect: true,
        completionTimeSeconds: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (isMissingLearningTableError(error)) return null;
    throw error;
  }
}
