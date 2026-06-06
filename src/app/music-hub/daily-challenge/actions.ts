"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { updateGamificationForUser } from "@/lib/gamification";
import { getDailyChallengeAttemptForUser } from "@/lib/music-hub";
import { prisma } from "@/lib/prisma";

const SubmitDailyChallengeSchema = z.object({
  challengeId: z.string().min(1),
  selectedIndex: z.number().int().min(0).max(10),
  completionTimeSeconds: z.number().int().min(0).max(60 * 60),
});

export async function submitDailyChallengeAttemptAction(input: unknown) {
  const parsed = SubmitDailyChallengeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid challenge submission" };
  }

  const challenge = await prisma.dailyChallenge.findFirst({
    where: { id: parsed.data.challengeId, isPublished: true },
    select: {
      id: true,
      correctIndex: true,
      explanation: true,
    },
  });

  if (!challenge) {
    return { ok: false as const, error: "Challenge is not available" };
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const existing = await getDailyChallengeAttemptForUser(challenge.id, userId);

  if (existing) {
    return {
      ok: true as const,
      attemptId: existing.id,
      selectedIndex: existing.selectedIndex,
      correctIndex: challenge.correctIndex,
      isCorrect: existing.isCorrect,
      explanation: challenge.explanation,
      alreadyAnswered: true,
    };
  }

  const isCorrect = parsed.data.selectedIndex === challenge.correctIndex;
  const attempt = await prisma.dailyChallengeAttempt.create({
    data: {
      challengeId: challenge.id,
      userId,
      selectedIndex: parsed.data.selectedIndex,
      isCorrect,
      completionTimeSeconds: parsed.data.completionTimeSeconds,
    },
    select: { id: true },
  });

  if (userId) {
    await updateGamificationForUser(userId, "daily-challenge");
  }

  revalidatePath("/music-hub/daily-challenge");
  revalidatePath("/music-hub/leaderboard");
  revalidatePath("/profile");
  revalidatePath("/");

  return {
    ok: true as const,
    attemptId: attempt.id,
    selectedIndex: parsed.data.selectedIndex,
    correctIndex: challenge.correctIndex,
    isCorrect,
    explanation: challenge.explanation,
    alreadyAnswered: false,
  };
}
