"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth";
import {
  getMusicSheetsMigrationErrorMessage,
  isMissingMusicSheetsTableError,
} from "@/lib/music-sheets";
import { z } from "zod";
import { getServerSession } from "next-auth";

function requireAdmin(session: any) {
  return session?.user && (session.user as any).role === "ADMIN";
}

const CreateSchema = z.object({
  audioUrl: z.string().url(),
  publicId: z.string().min(2),
  title: z.string().optional(),
});

export async function createMusicItemAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.musicItem.create({
    data: {
      audioUrl: parsed.data.audioUrl,
      publicId: parsed.data.publicId,
      title: parsed.data.title?.trim() || null,
    },
  });

  const title = parsed.data.title?.trim() || "New track";
  await prisma.announcement.create({
    data: {
      title: "New Music Release",
      body: `New track uploaded: ${title}. Visit the Music page to listen.`,
      isPublished: true,
    },
  });

  return { ok: true as const };
}

const DeleteSchema = z.object({ id: z.string().min(1) });

export async function deleteMusicItemAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.musicItem.delete({ where: { id: parsed.data.id } });
  return { ok: true as const };
}

const UpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
});

export async function updateMusicTitleAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.musicItem.update({
    where: { id: parsed.data.id },
    data: { title: parsed.data.title?.trim() || null },
  });

  return { ok: true as const };
}

const SheetAudienceSchema = z.enum(["ALL_USERS", "CHORISTERS_ONLY"]);

const CreateSheetSchema = z.object({
  fileUrl: z.string().url(),
  publicId: z.string().min(2),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().max(120).optional(),
  title: z.string().optional(),
  audience: SheetAudienceSchema,
});

export async function createMusicSheetAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = CreateSheetSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  try {
    const sheet = await prisma.musicSheet.create({
      data: {
        fileUrl: parsed.data.fileUrl,
        publicId: parsed.data.publicId,
        fileName: parsed.data.fileName.trim(),
        mimeType: parsed.data.mimeType?.trim() || null,
        title: parsed.data.title?.trim() || null,
        audience: parsed.data.audience,
      },
    });

    return { ok: true as const, sheet };
  } catch (error) {
    if (isMissingMusicSheetsTableError(error)) {
      return { ok: false as const, error: getMusicSheetsMigrationErrorMessage() };
    }
    throw error;
  }
}

const DeleteSheetSchema = z.object({ id: z.string().min(1) });

export async function deleteMusicSheetAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSheetSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  try {
    await prisma.musicSheet.delete({ where: { id: parsed.data.id } });
    return { ok: true as const };
  } catch (error) {
    if (isMissingMusicSheetsTableError(error)) {
      return { ok: false as const, error: getMusicSheetsMigrationErrorMessage() };
    }
    throw error;
  }
}

const UpdateSheetSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  audience: SheetAudienceSchema,
});

export async function updateMusicSheetAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateSheetSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  try {
    await prisma.musicSheet.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title?.trim() || null,
        audience: parsed.data.audience,
      },
    });

    return { ok: true as const };
  } catch (error) {
    if (isMissingMusicSheetsTableError(error)) {
      return { ok: false as const, error: getMusicSheetsMigrationErrorMessage() };
    }
    throw error;
  }
}
