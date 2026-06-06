"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import {
  challengeSubmissionStatuses,
  challengeTypes,
  getUniqueChallengeSlug,
} from "@/lib/challenges";
import { isAdminSession } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  normalizeSightReadingExercise,
  type SightReadingExercise,
} from "@/lib/sight-reading";

const ChallengeTypeSchema = z.enum(challengeTypes);
const SubmissionStatusSchema = z.enum(challengeSubmissionStatuses);

const ChallengeSchema = z.object({
  title: z.string().min(4).max(140),
  type: ChallengeTypeSchema,
  description: z.string().max(700).optional(),
  prompt: z.string().max(900).optional(),
  rules: z.string().max(1400).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  coverImagePublicId: z.string().max(220).optional(),
  sightReadingExercise: z
    .unknown()
    .optional()
    .transform((value) => normalizeSightReadingExercise(value)),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isPublished: z.boolean(),
});

const UpdateChallengeSchema = ChallengeSchema.extend({
  id: z.string().min(1),
});

const DeleteSchema = z.object({ id: z.string().min(1) });

const ModerateSubmissionSchema = z.object({
  id: z.string().min(1),
  status: SubmissionStatusSchema,
  adminNote: z.string().max(600).optional(),
});

const WinnerSchema = z.object({
  id: z.string().min(1),
  isWinner: z.boolean(),
});

function toDate(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return new Date(trimmed);
}

function adminError(error: unknown, fallback = "Something went wrong") {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return "A challenge with this title already exists.";
    if (error.code === "P2003") return "This record is still connected to submissions.";
  }

  return error instanceof Error ? error.message : fallback;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return null;
  return session;
}

function revalidateChallengeRoutes(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/admin/challenges");
  revalidatePath("/music-hub/challenges");
  revalidatePath("/profile");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/music-hub/challenges/${slug}`);
}

function toPrismaSightReadingExercise(exercise: SightReadingExercise | null) {
  return exercise ? (exercise as Prisma.InputJsonValue) : Prisma.DbNull;
}

export async function createChallengeAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = ChallengeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid challenge data" };

  try {
    const slug = await getUniqueChallengeSlug(parsed.data.title);
    await prisma.challenge.create({
      data: {
        title: parsed.data.title.trim(),
        slug,
        type: parsed.data.type,
        description: parsed.data.description?.trim() || null,
        prompt: parsed.data.prompt?.trim() || null,
        rules: parsed.data.rules?.trim() || null,
        coverImageUrl: parsed.data.coverImageUrl?.trim() || null,
        coverImagePublicId: parsed.data.coverImagePublicId?.trim() || null,
        sightReadingExercise: toPrismaSightReadingExercise(parsed.data.sightReadingExercise),
        startsAt: toDate(parsed.data.startsAt),
        endsAt: toDate(parsed.data.endsAt),
        isPublished: parsed.data.isPublished,
      },
    });

    revalidateChallengeRoutes(slug);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to create challenge") };
  }
}

export async function updateChallengeAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateChallengeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid challenge data" };

  try {
    const existing = await prisma.challenge.findUnique({
      where: { id: parsed.data.id },
      select: { title: true, slug: true },
    });
    const slug =
      existing && existing.title !== parsed.data.title.trim()
        ? await getUniqueChallengeSlug(parsed.data.title, parsed.data.id)
        : existing?.slug;

    await prisma.challenge.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title.trim(),
        ...(slug ? { slug } : {}),
        type: parsed.data.type,
        description: parsed.data.description?.trim() || null,
        prompt: parsed.data.prompt?.trim() || null,
        rules: parsed.data.rules?.trim() || null,
        coverImageUrl: parsed.data.coverImageUrl?.trim() || null,
        coverImagePublicId: parsed.data.coverImagePublicId?.trim() || null,
        sightReadingExercise: toPrismaSightReadingExercise(parsed.data.sightReadingExercise),
        startsAt: toDate(parsed.data.startsAt),
        endsAt: toDate(parsed.data.endsAt),
        isPublished: parsed.data.isPublished,
      },
    });

    revalidateChallengeRoutes(slug ?? existing?.slug);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to update challenge") };
  }
}

export async function deleteChallengeAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid challenge" };

  try {
    const challenge = await prisma.challenge.delete({
      where: { id: parsed.data.id },
      select: { slug: true },
    });
    revalidateChallengeRoutes(challenge.slug);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to delete challenge") };
  }
}

export async function moderateChallengeSubmissionAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = ModerateSubmissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid moderation data" };

  try {
    const submission = await prisma.challengeSubmission.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote?.trim() || null,
      },
      select: {
        challenge: {
          select: { slug: true },
        },
      },
    });

    revalidateChallengeRoutes(submission.challenge.slug);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to moderate submission") };
  }
}

export async function setChallengeSubmissionWinnerAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = WinnerSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid winner data" };

  try {
    const submission = await prisma.challengeSubmission.update({
      where: { id: parsed.data.id },
      data: { isWinner: parsed.data.isWinner },
      select: {
        challenge: {
          select: { slug: true },
        },
      },
    });

    revalidateChallengeRoutes(submission.challenge.slug);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to update winner") };
  }
}

export async function deleteChallengeSubmissionAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid submission" };

  try {
    const submission = await prisma.challengeSubmission.delete({
      where: { id: parsed.data.id },
      select: {
        challenge: {
          select: { slug: true },
        },
      },
    });

    revalidateChallengeRoutes(submission.challenge.slug);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: adminError(error, "Unable to delete submission") };
  }
}
