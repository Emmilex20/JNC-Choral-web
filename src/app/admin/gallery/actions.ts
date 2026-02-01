"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth";
import { z } from "zod";
import { getServerSession } from "next-auth";

function requireAdmin(session: any) {
  return session?.user && (session.user as any).role === "ADMIN";
}

const CreateSchema = z.object({
  imageUrl: z.string().url(),
  publicId: z.string().min(2),
  title: z.string().optional(),
});

export async function createGalleryItemAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.galleryItem.create({
    data: {
      imageUrl: parsed.data.imageUrl,
      publicId: parsed.data.publicId,
      title: parsed.data.title?.trim() || null,
    },
  });

  return { ok: true as const };
}

const DeleteSchema = z.object({ id: z.string().min(1) });

export async function deleteGalleryItemAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.galleryItem.delete({ where: { id: parsed.data.id } });
  return { ok: true as const };
}
