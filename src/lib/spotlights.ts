import { isMissingLearningTableError } from "@/lib/learning-errors";
import { prisma } from "@/lib/prisma";

export const spotlightSelect = {
  id: true,
  featuredUserId: true,
  name: true,
  photoUrl: true,
  photoPublicId: true,
  story: true,
  musicalJourney: true,
  favoriteSong: true,
  advice: true,
  weekStart: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
  featuredUser: {
    select: {
      name: true,
      email: true,
      image: true,
    },
  },
} as const;

export async function getCurrentSpotlight() {
  try {
    return await prisma.choristerSpotlight.findFirst({
      where: { isPublished: true },
      orderBy: [{ weekStart: "desc" }, { createdAt: "desc" }],
      select: spotlightSelect,
    });
  } catch (error) {
    if (isMissingLearningTableError(error)) return null;
    throw error;
  }
}

export async function listPublishedSpotlights(take = 40) {
  try {
    return await prisma.choristerSpotlight.findMany({
      where: { isPublished: true },
      orderBy: [{ weekStart: "desc" }, { createdAt: "desc" }],
      take,
      select: spotlightSelect,
    });
  } catch (error) {
    if (isMissingLearningTableError(error)) return [];
    throw error;
  }
}
