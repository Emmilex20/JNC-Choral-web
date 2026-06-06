import type { MetadataRoute } from "next";

import { listPublishedAcademyArticlesForSitemap } from "@/lib/academy";
import { listPublicScoreSheets } from "@/lib/music-sheets";
import { listPublishedQuizzesForSitemap } from "@/lib/music-hub";

const siteUrl = "https://www.jnc.vercel.app";

type ScoreSitemapEntry = Awaited<ReturnType<typeof listPublicScoreSheets>>[number];
type AcademySitemapEntry = Awaited<
  ReturnType<typeof listPublishedAcademyArticlesForSitemap>
>[number];
type QuizSitemapEntry = Awaited<ReturnType<typeof listPublishedQuizzesForSitemap>>[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const routes = [
    "",
    "/about",
    "/auditions",
    "/events",
    "/news",
    "/scores",
    "/academy",
    "/music-hub/quizzes",
    "/music-hub/daily-challenge",
    "/music-hub/leaderboard",
    "/community/spotlights",
    "/gallery",
    "/music",
    "/videos",
    "/contact",
    "/privacy-policy",
    "/terms-of-service",
    "/cookie-policy",
  ];

  const [scores, academyArticles, quizzes] = await Promise.all([
    listPublicScoreSheets(),
    listPublishedAcademyArticlesForSitemap(),
    listPublishedQuizzesForSitemap(),
  ]);

  return [
    ...routes.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/scores" ? 0.85 : 0.6,
    })),
    ...scores.map((score: ScoreSitemapEntry) => ({
      url: `${siteUrl}/scores/${score.slug}`,
      lastModified: score.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...academyArticles.map((article: AcademySitemapEntry) => ({
      url: `${siteUrl}/academy/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.72,
    })),
    ...quizzes.map((quiz: QuizSitemapEntry) => ({
      url: `${siteUrl}/music-hub/quizzes/${quiz.slug}`,
      lastModified: quiz.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
