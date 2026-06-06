"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { updateGamificationForUser } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";

const SubmitQuizSchema = z.object({
  quizId: z.string().min(1),
  answers: z.array(z.number().int().min(0).max(10)),
  completionTimeSeconds: z.number().int().min(0).max(60 * 60 * 4),
});

export async function submitQuizAttemptAction(input: unknown) {
  const parsed = SubmitQuizSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid quiz submission" };

  const quiz = await prisma.quiz.findFirst({
    where: { id: parsed.data.quizId, isPublished: true },
    select: {
      id: true,
      slug: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          correctIndex: true,
        },
      },
    },
  });

  if (!quiz || quiz.questions.length === 0) {
    return { ok: false as const, error: "Quiz is not available" };
  }

  const answers = parsed.data.answers.slice(0, quiz.questions.length);
  const score = quiz.questions.reduce(
    (total, question, index) =>
      total + (answers[index] === question.correctIndex ? 1 : 0),
    0
  );

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId,
      score,
      totalQuestions: quiz.questions.length,
      completionTimeSeconds: parsed.data.completionTimeSeconds,
      answers: quiz.questions.map((question, index) => ({
        questionId: question.id,
        selectedIndex: answers[index] ?? null,
        correctIndex: question.correctIndex,
        isCorrect: answers[index] === question.correctIndex,
      })),
    },
    select: { id: true },
  });

  if (userId) {
    await updateGamificationForUser(userId, "quiz-attempt");
  }

  revalidatePath("/music-hub/quizzes");
  revalidatePath("/music-hub/leaderboard");
  revalidatePath("/profile");
  revalidatePath("/");

  return {
    ok: true as const,
    attemptId: attempt.id,
    score,
    totalQuestions: quiz.questions.length,
    resultsHref: `/music-hub/quizzes/${quiz.slug}/results?attemptId=${attempt.id}`,
  };
}
