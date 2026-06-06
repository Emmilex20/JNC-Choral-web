import { BookOpenText, Brain, Lightbulb } from "lucide-react";

import { ensureAcademyCategories } from "@/lib/academy";
import { normalizeEarTrainingSoundConfig } from "@/lib/ear-training";
import { dateToDateInputValue, getLagosDateKey, parseOptions } from "@/lib/music-hub";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import AdminAcademyClient from "./ui/admin-academy-client";

export default async function AdminAcademyPage() {
  await ensureAcademyCategories();

  const [categories, articles, quizzes, challenges] = await Promise.all([
    prisma.academyCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    }),
    prisma.academyArticle.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 300,
      include: {
        category: {
          select: { name: true, slug: true },
        },
      },
    }),
    prisma.quiz.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 200,
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { attempts: true },
        },
      },
    }),
    prisma.dailyChallenge.findMany({
      orderBy: [{ challengeDate: "desc" }],
      take: 120,
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    }),
  ]);

  const publishedArticles = articles.filter((article) => article.status === "PUBLISHED").length;
  const publishedQuizzes = quizzes.filter((quiz) => quiz.isPublished).length;
  const publishedChallenges = challenges.filter((challenge) => challenge.isPublished).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Music Academy"
        title="Teach, test, and challenge the JNC community."
        description="Manage academy articles, music quizzes, and the daily theory challenge without disturbing the rest of the platform."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="admin-stat-card min-h-0">
            <div className="flex items-center gap-2 text-sm text-white/68">
              <BookOpenText className="h-4 w-4 text-amber-100" />
              Articles
            </div>
            <p className="admin-metric-value">{articles.length}</p>
            <p className="text-sm admin-subtle">{publishedArticles} published</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <div className="flex items-center gap-2 text-sm text-white/68">
              <Brain className="h-4 w-4 text-cyan-100" />
              Quizzes
            </div>
            <p className="admin-metric-value">{quizzes.length}</p>
            <p className="text-sm admin-subtle">{publishedQuizzes} published</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <div className="flex items-center gap-2 text-sm text-white/68">
              <Lightbulb className="h-4 w-4 text-emerald-100" />
              Challenges
            </div>
            <p className="admin-metric-value">{challenges.length}</p>
            <p className="text-sm admin-subtle">{publishedChallenges} published</p>
          </div>
        </div>
      </AdminPageHeader>

      <AdminAcademyClient
        todayDateKey={getLagosDateKey()}
        initialCategories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          articleCount: category._count.articles,
        }))}
        initialArticles={articles.map((article) => ({
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          body: article.body,
          coverImageUrl: article.coverImageUrl,
          coverImagePublicId: article.coverImagePublicId,
          tags: article.tags,
          status: article.status,
          isFeatured: article.isFeatured,
          isTrending: article.isTrending,
          categoryId: article.categoryId,
          categoryName: article.category.name,
          createdAt: article.createdAt.toISOString(),
          updatedAt: article.updatedAt.toISOString(),
          publishedAt: article.publishedAt?.toISOString() ?? null,
        }))}
        initialQuizzes={quizzes.map((quiz) => ({
          id: quiz.id,
          title: quiz.title,
          slug: quiz.slug,
          description: quiz.description,
          category: quiz.category,
          isPublished: quiz.isPublished,
          isPopular: quiz.isPopular,
          attemptCount: quiz._count.attempts,
          createdAt: quiz.createdAt.toISOString(),
          questions: quiz.questions.map((question) => ({
            id: question.id,
            prompt: question.prompt,
            options: parseOptions(question.options),
            correctIndex: question.correctIndex,
            explanation: question.explanation,
          })),
        }))}
        initialChallenges={challenges.map((challenge) => ({
          id: challenge.id,
          challengeDate: dateToDateInputValue(challenge.challengeDate),
          title: challenge.title,
          prompt: challenge.prompt,
          options: parseOptions(challenge.options),
          correctIndex: challenge.correctIndex,
          explanation: challenge.explanation,
          soundConfig: normalizeEarTrainingSoundConfig(challenge.soundConfig),
          isPublished: challenge.isPublished,
          attemptCount: challenge._count.attempts,
          createdAt: challenge.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
