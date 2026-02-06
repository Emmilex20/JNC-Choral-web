"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth";
import { z } from "zod";
import { getServerSession } from "next-auth";

function requireAdmin(session: any) {
  return session?.user && (session.user as any).role === "ADMIN";
}

const CreateSchema = z.object({
  videoUrl: z.string().url(),
  publicId: z.string().min(2),
  title: z.string().optional(),
});

export async function createVideoItemAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.videoItem.create({
    data: {
      videoUrl: parsed.data.videoUrl,
      publicId: parsed.data.publicId,
      title: parsed.data.title?.trim() || null,
    },
  });

  const title = parsed.data.title?.trim() || "New video";
  await prisma.announcement.create({
    data: {
      title: "New Video Release",
      body: `New video uploaded: ${title}. Visit the Videos page to watch.`,
      isPublished: true,
    },
  });

  return { ok: true as const };
}

const DeleteSchema = z.object({ id: z.string().min(1) });

export async function deleteVideoItemAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.videoItem.delete({ where: { id: parsed.data.id } });
  return { ok: true as const };
}

const UpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
});

export async function updateVideoTitleAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.videoItem.update({
    where: { id: parsed.data.id },
    data: { title: parsed.data.title?.trim() || null },
  });

  return { ok: true as const };
}

const UpdatePosterSchema = z.object({
  id: z.string().min(1),
  posterUrl: z.union([z.string().url(), z.null()]),
});

export async function updateVideoPosterAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdatePosterSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.videoItem.update({
    where: { id: parsed.data.id },
    data: { posterUrl: parsed.data.posterUrl },
  });

  return { ok: true as const };
}
