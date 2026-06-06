import type { Prisma } from "@prisma/client";

import { createContentSlug, isMissingLearningTableError } from "@/lib/learning-errors";
import { prisma } from "@/lib/prisma";

const publishedStatus = "PUBLISHED";

export const academySeedCategories = [
  {
    name: "Music Theory",
    slug: "music-theory",
    description: "Notes, rhythm, harmony, sight-reading, and the language of music.",
  },
  {
    name: "Vocal Training",
    slug: "vocal-training",
    description: "Breath, tone, diction, range, stamina, and healthy singing practice.",
  },
  {
    name: "Instrumental Training",
    slug: "instrumental-training",
    description: "Practical guidance for players serving in worship and choral settings.",
  },
  {
    name: "Choral Leadership",
    slug: "choral-leadership",
    description: "Conducting, rehearsal culture, section leadership, and choir discipline.",
  },
  {
    name: "Worship Music",
    slug: "worship-music",
    description: "Liturgical music, praise, prayerful song selection, and ministry preparation.",
  },
  {
    name: "Music History",
    slug: "music-history",
    description: "Stories, composers, traditions, and African sacred music heritage.",
  },
] as const;

export const academyArticleCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  body: true,
  coverImageUrl: true,
  tags: true,
  isFeatured: true,
  isTrending: true,
  views: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.AcademyArticleSelect;

export type AcademyArticleCard = Prisma.AcademyArticleGetPayload<{
  select: typeof academyArticleCardSelect;
}>;

export type AcademyCategoryListItem = {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: { articles: number };
};

export function getReadingMinutes(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 190));
}

export async function ensureAcademyCategories() {
  try {
    await Promise.all(
      academySeedCategories.map((category) =>
        prisma.academyCategory.upsert({
          where: { slug: category.slug },
          create: category,
          update: {
            name: category.name,
            description: category.description,
          },
        })
      )
    );
  } catch (error) {
    if (isMissingLearningTableError(error)) return;
    throw error;
  }
}

export async function listAcademyCategories(): Promise<AcademyCategoryListItem[]> {
  try {
    const categories = await prisma.academyCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            articles: { where: { status: publishedStatus } },
          },
        },
      },
    });

    if (categories.length === 0) {
      return academySeedCategories.map((category) => ({
        ...category,
        description: category.description,
        _count: { articles: 0 },
      }));
    }

    return categories;
  } catch (error) {
    if (isMissingLearningTableError(error)) {
      return academySeedCategories.map((category) => ({
        ...category,
        description: category.description,
        _count: { articles: 0 },
      }));
    }
    throw error;
  }
}

export async function getUniqueAcademyCategorySlug(name: string, id?: string) {
  const base = createContentSlug(name, "category");
  let candidate = base;
  let suffix = 2;

  while (
    await prisma.academyCategory.findFirst({
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

export async function getUniqueAcademyArticleSlug(title: string, id?: string) {
  const base = createContentSlug(title, "article");
  let candidate = base;
  let suffix = 2;

  while (
    await prisma.academyArticle.findFirst({
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

export async function getAcademyIndexData({
  search,
  category,
}: {
  search?: string;
  category?: string;
}) {
  const query = search?.trim();
  const where: Prisma.AcademyArticleWhereInput = {
    status: publishedStatus,
    ...(category ? { category: { slug: category } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  try {
    const [categories, articles, featured, trending] = await Promise.all([
      listAcademyCategories(),
      prisma.academyArticle.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 18,
        select: academyArticleCardSelect,
      }),
      prisma.academyArticle.findFirst({
        where: { status: publishedStatus, isFeatured: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        select: academyArticleCardSelect,
      }),
      prisma.academyArticle.findMany({
        where: { status: publishedStatus, isTrending: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: academyArticleCardSelect,
      }),
    ]);

    return { categories, articles, featured, trending };
  } catch (error) {
    if (isMissingLearningTableError(error)) {
      return {
        categories: academySeedCategories.map((item) => ({
          ...item,
          description: item.description,
          _count: { articles: 0 },
        })),
        articles: [],
        featured: null,
        trending: [],
      };
    }
    throw error;
  }
}

export async function getAcademyArticleBySlug(slug: string) {
  try {
    const article = await prisma.academyArticle.findFirst({
      where: { slug, status: publishedStatus },
      select: academyArticleCardSelect,
    });

    if (!article) return null;

    const related = await prisma.academyArticle.findMany({
      where: {
        status: publishedStatus,
        id: { not: article.id },
        OR: [
          { category: { slug: article.category.slug } },
          ...(article.tags.length > 0 ? [{ tags: { hasSome: article.tags } }] : []),
        ],
      },
      orderBy: [{ isTrending: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: academyArticleCardSelect,
    });

    return { article, related };
  } catch (error) {
    if (isMissingLearningTableError(error)) return null;
    throw error;
  }
}

export async function getFeaturedAcademyArticle() {
  try {
    return await prisma.academyArticle.findFirst({
      where: { status: publishedStatus },
      orderBy: [
        { isFeatured: "desc" },
        { isTrending: "desc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      select: academyArticleCardSelect,
    });
  } catch (error) {
    if (isMissingLearningTableError(error)) return null;
    throw error;
  }
}

export async function listPublishedAcademyArticlesForSitemap() {
  try {
    return await prisma.academyArticle.findMany({
      where: { status: publishedStatus },
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
