"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { isAdminSession } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const SpotlightSchema = z.object({
  featuredUserId: z.string().optional(),
  name: z.string().min(2).max(120),
  photoUrl: z.string().url().optional().or(z.literal("")),
  photoPublicId: z.string().optional(),
  story: z.string().min(20).max(2400),
  musicalJourney: z.string().min(10).max(1800),
  favoriteSong: z.string().max(160).optional(),
  advice: z.string().max(500).optional(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isPublished: z.boolean(),
});

const UpdateSpotlightSchema = SpotlightSchema.extend({
  id: z.string().min(1),
});

const DeleteSchema = z.object({
  id: z.string().min(1),
});

function weekDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function revalidateSpotlightRoutes() {
  revalidatePath("/");
  revalidatePath("/community/spotlights");
  revalidatePath("/admin/spotlights");
  revalidatePath("/sitemap.xml");
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return null;
  return session;
}

export async function createSpotlightAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = SpotlightSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid spotlight data" };

  await prisma.choristerSpotlight.create({
    data: {
      featuredUserId: parsed.data.featuredUserId || null,
      name: parsed.data.name.trim(),
      photoUrl: parsed.data.photoUrl?.trim() || null,
      photoPublicId: parsed.data.photoPublicId?.trim() || null,
      story: parsed.data.story.trim(),
      musicalJourney: parsed.data.musicalJourney.trim(),
      favoriteSong: parsed.data.favoriteSong?.trim() || null,
      advice: parsed.data.advice?.trim() || null,
      weekStart: weekDate(parsed.data.weekStart),
      isPublished: parsed.data.isPublished,
    },
  });

  revalidateSpotlightRoutes();
  return { ok: true as const };
}

export async function updateSpotlightAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateSpotlightSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid spotlight data" };

  await prisma.choristerSpotlight.update({
    where: { id: parsed.data.id },
    data: {
      featuredUserId: parsed.data.featuredUserId || null,
      name: parsed.data.name.trim(),
      photoUrl: parsed.data.photoUrl?.trim() || null,
      photoPublicId: parsed.data.photoPublicId?.trim() || null,
      story: parsed.data.story.trim(),
      musicalJourney: parsed.data.musicalJourney.trim(),
      favoriteSong: parsed.data.favoriteSong?.trim() || null,
      advice: parsed.data.advice?.trim() || null,
      weekStart: weekDate(parsed.data.weekStart),
      isPublished: parsed.data.isPublished,
    },
  });

  revalidateSpotlightRoutes();
  return { ok: true as const };
}

export async function deleteSpotlightAction(input: unknown) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid spotlight" };

  await prisma.choristerSpotlight.delete({ where: { id: parsed.data.id } });
  revalidateSpotlightRoutes();
  return { ok: true as const };
}
