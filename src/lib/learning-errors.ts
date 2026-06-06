import { Prisma } from "@prisma/client";

const learningTables = [
  "AcademyCategory",
  "AcademyArticle",
  "Quiz",
  "Question",
  "QuizAttempt",
  "DailyChallenge",
  "DailyChallengeAttempt",
  "LeaderboardEntry",
  "Achievement",
  "UserAchievement",
  "ChoristerSpotlight",
];

export function isMissingLearningTableError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2021" && error.code !== "P2022") return false;

  const metaValues = Object.values(error.meta ?? {});
  return metaValues.some(
    (value) =>
      typeof value === "string" &&
      learningTables.some((table) => value.includes(table))
  );
}

export function createContentSlug(input: string, fallback = "jnc") {
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 88);

  return slug || fallback;
}

export function normalizeTags(input: string | string[] | null | undefined) {
  const parts = Array.isArray(input) ? input : input?.split(",");

  return Array.from(
    new Set(
      (parts ?? [])
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, 40))
    )
  ).slice(0, 12);
}
