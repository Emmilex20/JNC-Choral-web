"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth";
import { isAdminSession } from "@/lib/authz";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

const CreateSchema = z.object({
  videoUrl: z.string().url(),
  publicId: z.string().min(2),
  posterUrl: z.string().url().optional(),
  title: z.string().optional(),
});

export async function createVideoItemAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const item = await prisma.videoItem.create({
    data: {
      videoUrl: parsed.data.videoUrl,
      publicId: parsed.data.publicId,
      posterUrl: parsed.data.posterUrl ?? null,
      title: parsed.data.title?.trim() || null,
    },
    select: {
      id: true,
      title: true,
      videoUrl: true,
      posterUrl: true,
      publicId: true,
      createdAt: true,
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

  revalidatePath("/videos");
  revalidatePath("/admin/videos");
  revalidatePath("/news");

  return {
    ok: true as const,
    item: {
      ...item,
      createdAt: item.createdAt.toISOString(),
    },
  };
}

const DeleteSchema = z.object({ id: z.string().min(1) });

export async function deleteVideoItemAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.videoItem.delete({ where: { id: parsed.data.id } });
  revalidatePath("/videos");
  revalidatePath("/admin/videos");
  return { ok: true as const };
}

const UpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
});

export async function updateVideoTitleAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.videoItem.update({
    where: { id: parsed.data.id },
    data: { title: parsed.data.title?.trim() || null },
  });

  revalidatePath("/videos");
  revalidatePath("/admin/videos");
  return { ok: true as const };
}

const UpdatePosterSchema = z.object({
  id: z.string().min(1),
  posterUrl: z.union([z.string().url(), z.null()]),
});

export async function updateVideoPosterAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdatePosterSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.videoItem.update({
    where: { id: parsed.data.id },
    data: { posterUrl: parsed.data.posterUrl },
  });

  revalidatePath("/videos");
  revalidatePath("/admin/videos");
  return { ok: true as const };
}
