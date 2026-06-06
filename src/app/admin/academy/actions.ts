"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import {
  getUniqueAcademyArticleSlug,
  getUniqueAcademyCategorySlug,
} from "@/lib/academy";
import { isAdminSession } from "@/lib/authz";
import { normalizeTags } from "@/lib/learning-errors";
import { dateKeyToUtcDate, getUniqueQuizSlug, quizCategories } from "@/lib/music-hub";
import { prisma } from "@/lib/prisma";

const ArticleStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);
const publishedStatus = "PUBLISHED";

const CategorySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(220).optional(),
});

const ArticleSchema = z.object({
  title: z.string().min(4).max(140),
  excerpt: z.string().max(260).optional(),
  body: z.string().min(20),
  categoryId: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  coverImagePublicId: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  status: ArticleStatusSchema,
  isFeatured: z.boolean(),
  isTrending: z.boolean(),
});

const UpdateArticleSchema = ArticleSchema.extend({
  id: z.string().min(1),
});

const DeleteSchema = z.object({ id: z.string().min(1) });

const QuizCategorySchema = z.enum(quizCategories);

const QuestionSchema = z.object({
  prompt: z.string().min(4).max(500),
  options: z.array(z.string().min(1).max(180)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().max(500).optional(),
});

const QuizSchema = z.object({
  title: z.string().min(4).max(120),
  description: z.string().max(360).optional(),
  category: QuizCategorySchema,
  isPublished: z.boolean(),
  isPopular: z.boolean(),
  questions: z.array(QuestionSchema).min(1).max(30),
});

const UpdateQuizSchema = QuizSchema.extend({
  id: z.string().min(1),
});

const DailyChallengeSchema = z.object({
  challengeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(4).max(120),
  prompt: z.string().min(4).max(500),
  options: z.array(z.string().min(1).max(180)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().max(500).optional(),
  isPublished: z.boolean(),
});

const UpdateDailyChallengeSchema = DailyChallengeSchema.extend({
  id: z.string().min(1),
});

function adminError(error: unknown, fallback = "Something went wrong") {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      return "This record is still connected to content. Remove or move that content first.";
    }
    if (error.code === "P2002") {
      return "A record with this title or date already exists.";
    }
  }

  return error instanceof Error ? error.message : fallback;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return null;
  return session;
}

function revalidateLearningRoutes() {
  revalidatePath("/");
  revalidatePath("/academy");
  revalidatePath("/music-hub/quizzes");
  revalidatePath("/music-hub/daily-challenge");
  revalidatePath("/sitemap.xml");
}

export async function createAcademyCategoryAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = CategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid category data" };

  try {
    const slug = await getUniqueAcademyCategorySlug(parsed.data.name);
    await prisma.academyCategory.create({
      data: {
        name: parsed.data.name.trim(),
        slug,
        description: parsed.data.description?.trim() || null,
      },
    });
    revalidatePath("/academy");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to create category") };
  }
}

export async function deleteAcademyCategoryAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid category" };

  try {
    await prisma.academyCategory.delete({ where: { id: parsed.data.id } });
    revalidatePath("/academy");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to delete category") };
  }
}

export async function createAcademyArticleAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = ArticleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid article data" };

  try {
    const status = parsed.data.status;
    const slug = await getUniqueAcademyArticleSlug(parsed.data.title);

    await prisma.academyArticle.create({
      data: {
        title: parsed.data.title.trim(),
        slug,
        excerpt: parsed.data.excerpt?.trim() || null,
        body: parsed.data.body.trim(),
        categoryId: parsed.data.categoryId,
        coverImageUrl: parsed.data.coverImageUrl?.trim() || null,
        coverImagePublicId: parsed.data.coverImagePublicId?.trim() || null,
        tags: normalizeTags(parsed.data.tags),
        status,
        isFeatured: parsed.data.isFeatured,
        isTrending: parsed.data.isTrending,
        publishedAt: status === publishedStatus ? new Date() : null,
        authorId: session.user.id,
      },
    });

    revalidateLearningRoutes();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to create article") };
  }
}

export async function updateAcademyArticleAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateArticleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid article data" };

  try {
    const existing = await prisma.academyArticle.findUnique({
      where: { id: parsed.data.id },
      select: { publishedAt: true },
    });
    const status = parsed.data.status;

    await prisma.academyArticle.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title.trim(),
        excerpt: parsed.data.excerpt?.trim() || null,
        body: parsed.data.body.trim(),
        categoryId: parsed.data.categoryId,
        coverImageUrl: parsed.data.coverImageUrl?.trim() || null,
        coverImagePublicId: parsed.data.coverImagePublicId?.trim() || null,
        tags: normalizeTags(parsed.data.tags),
        status,
        isFeatured: parsed.data.isFeatured,
        isTrending: parsed.data.isTrending,
        publishedAt:
          status === publishedStatus
            ? existing?.publishedAt ?? new Date()
            : null,
      },
    });

    revalidateLearningRoutes();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to update article") };
  }
}

export async function deleteAcademyArticleAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid article" };

  try {
    await prisma.academyArticle.delete({ where: { id: parsed.data.id } });
    revalidateLearningRoutes();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to delete article") };
  }
}

export async function createQuizAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = QuizSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid quiz data" };

  try {
    const slug = await getUniqueQuizSlug(parsed.data.title);
    await prisma.quiz.create({
      data: {
        title: parsed.data.title.trim(),
        slug,
        description: parsed.data.description?.trim() || null,
        category: parsed.data.category,
        isPublished: parsed.data.isPublished,
        isPopular: parsed.data.isPopular,
        questions: {
          create: parsed.data.questions.map((question, index) => ({
            prompt: question.prompt.trim(),
            options: question.options.map((option) => option.trim()),
            correctIndex: question.correctIndex,
            explanation: question.explanation?.trim() || null,
            order: index,
          })),
        },
      },
    });

    revalidateLearningRoutes();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to create quiz") };
  }
}

export async function updateQuizAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateQuizSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid quiz data" };

  try {
    await prisma.quiz.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title.trim(),
        description: parsed.data.description?.trim() || null,
        category: parsed.data.category,
        isPublished: parsed.data.isPublished,
        isPopular: parsed.data.isPopular,
        questions: {
          deleteMany: {},
          create: parsed.data.questions.map((question, index) => ({
            prompt: question.prompt.trim(),
            options: question.options.map((option) => option.trim()),
            correctIndex: question.correctIndex,
            explanation: question.explanation?.trim() || null,
            order: index,
          })),
        },
      },
    });

    revalidateLearningRoutes();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to update quiz") };
  }
}

export async function deleteQuizAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid quiz" };

  try {
    await prisma.quiz.delete({ where: { id: parsed.data.id } });
    revalidateLearningRoutes();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to delete quiz") };
  }
}

export async function createDailyChallengeAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = DailyChallengeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid challenge data" };

  try {
    const challengeDate = dateKeyToUtcDate(parsed.data.challengeDate);

    await prisma.dailyChallenge.upsert({
      where: { challengeDate },
      create: {
        challengeDate,
        title: parsed.data.title.trim(),
        prompt: parsed.data.prompt.trim(),
        options: parsed.data.options.map((option) => option.trim()),
        correctIndex: parsed.data.correctIndex,
        explanation: parsed.data.explanation?.trim() || null,
        isPublished: parsed.data.isPublished,
      },
      update: {
        title: parsed.data.title.trim(),
        prompt: parsed.data.prompt.trim(),
        options: parsed.data.options.map((option) => option.trim()),
        correctIndex: parsed.data.correctIndex,
        explanation: parsed.data.explanation?.trim() || null,
        isPublished: parsed.data.isPublished,
      },
    });

    revalidateLearningRoutes();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to save challenge") };
  }
}

export async function updateDailyChallengeAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateDailyChallengeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid challenge data" };

  try {
    await prisma.dailyChallenge.update({
      where: { id: parsed.data.id },
      data: {
        challengeDate: dateKeyToUtcDate(parsed.data.challengeDate),
        title: parsed.data.title.trim(),
        prompt: parsed.data.prompt.trim(),
        options: parsed.data.options.map((option) => option.trim()),
        correctIndex: parsed.data.correctIndex,
        explanation: parsed.data.explanation?.trim() || null,
        isPublished: parsed.data.isPublished,
      },
    });

    revalidateLearningRoutes();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to update challenge") };
  }
}

export async function deleteDailyChallengeAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid challenge" };

  try {
    await prisma.dailyChallenge.delete({ where: { id: parsed.data.id } });
    revalidateLearningRoutes();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to delete challenge") };
  }
}
