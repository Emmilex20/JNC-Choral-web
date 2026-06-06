"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { challengeMediaTypes } from "@/lib/challenges";
import { prisma } from "@/lib/prisma";

const ChallengeSubmissionSchema = z
  .object({
    challengeId: z.string().min(1),
    title: z.string().max(120).optional(),
    description: z.string().min(10).max(1800),
    mediaType: z.enum(challengeMediaTypes),
    audioUrl: z.string().url().optional().or(z.literal("")),
    videoUrl: z.string().url().optional().or(z.literal("")),
    mediaPublicId: z.string().max(220).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mediaType === "AUDIO" && !value.audioUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["audioUrl"],
        message: "Audio file is required for audio submissions.",
      });
    }
    if (value.mediaType === "VIDEO" && !value.videoUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["videoUrl"],
        message: "Video file is required for video submissions.",
      });
    }
  });

const VoteSchema = z.object({
  challengeId: z.string().min(1),
  submissionId: z.string().min(1),
});

function revalidateChallengeRoutes(slug?: string) {
  revalidatePath("/");
  revalidatePath("/music-hub/challenges");
  revalidatePath("/profile");
  if (slug) revalidatePath(`/music-hub/challenges/${slug}`);
}

function isTrustedCloudinaryUrl(value?: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      (!cloudName || url.pathname.startsWith(`/${cloudName}/`))
    );
  } catch {
    return false;
  }
}

export async function submitChallengeSubmissionAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false as const, error: "Sign in to submit your challenge entry." };
  }

  const parsed = ChallengeSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid challenge submission." };
  }

  if (
    parsed.data.mediaType === "AUDIO" &&
    !isTrustedCloudinaryUrl(parsed.data.audioUrl)
  ) {
    return { ok: false as const, error: "Upload audio through the JNC uploader." };
  }

  if (
    parsed.data.mediaType === "VIDEO" &&
    !isTrustedCloudinaryUrl(parsed.data.videoUrl)
  ) {
    return { ok: false as const, error: "Upload video through the JNC uploader." };
  }

  const now = new Date();
  const challenge = await prisma.challenge.findFirst({
    where: {
      id: parsed.data.challengeId,
      isPublished: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    select: { id: true, slug: true },
  });

  if (!challenge) {
    return { ok: false as const, error: "This challenge is not accepting submissions." };
  }

  await prisma.challengeSubmission.create({
    data: {
      challengeId: challenge.id,
      userId: session.user.id,
      title: parsed.data.title?.trim() || null,
      description: parsed.data.description.trim(),
      mediaType: parsed.data.mediaType,
      audioUrl: parsed.data.mediaType === "AUDIO" ? parsed.data.audioUrl?.trim() || null : null,
      videoUrl: parsed.data.mediaType === "VIDEO" ? parsed.data.videoUrl?.trim() || null : null,
      mediaPublicId: parsed.data.mediaPublicId?.trim() || null,
      status: "PENDING",
    },
  });

  revalidateChallengeRoutes(challenge.slug);
  return {
    ok: true as const,
    message: "Submission received. Admin will review it before it appears publicly.",
  };
}

export async function voteChallengeSubmissionAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false as const, error: "Sign in to vote for a challenge entry." };
  }

  const parsed = VoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid vote." };

  const submission = await prisma.challengeSubmission.findFirst({
    where: {
      id: parsed.data.submissionId,
      challengeId: parsed.data.challengeId,
      status: "APPROVED",
      challenge: { isPublished: true },
    },
    select: {
      id: true,
      challengeId: true,
      userId: true,
      challenge: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!submission) {
    return { ok: false as const, error: "This submission is not available for voting." };
  }

  if (submission.userId === session.user.id) {
    return { ok: false as const, error: "You cannot vote for your own submission." };
  }

  try {
    await prisma.challengeVote.create({
      data: {
        challengeId: submission.challengeId,
        submissionId: submission.id,
        userId: session.user.id,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        ok: false as const,
        error: "You have already voted in this challenge.",
      };
    }
    throw error;
  }

  revalidateChallengeRoutes(submission.challenge.slug);
  return { ok: true as const };
}
