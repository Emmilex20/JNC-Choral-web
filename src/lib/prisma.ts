import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const createClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
    log: ["error", "warn"],
  });

const hasCurrentModelDelegates = (client?: PrismaClient) => {
  const maybeClient = client as
    | {
        galleryItem?: unknown;
        academyArticle?: unknown;
        quiz?: unknown;
        dailyChallenge?: unknown;
        leaderboardEntry?: unknown;
        achievement?: unknown;
        userAchievement?: unknown;
        choristerSpotlight?: unknown;
      }
    | undefined;

  return Boolean(
    maybeClient?.galleryItem &&
      maybeClient.academyArticle &&
      maybeClient.quiz &&
      maybeClient.dailyChallenge &&
      maybeClient.leaderboardEntry &&
      maybeClient.achievement &&
      maybeClient.userAchievement &&
      maybeClient.choristerSpotlight
  );
};

export const prisma =
  globalForPrisma.prisma && hasCurrentModelDelegates(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
