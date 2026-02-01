"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth";
import { z } from "zod";
import { getServerSession } from "next-auth";

function requireAdmin(session: any) {
  return session?.user && (session.user as any).role === "ADMIN";
}

const CreateSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(5),
});

export async function createAnnouncementAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.announcement.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      isPublished: false,
    },
  });

  return { ok: true as const };
}

const UpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  body: z.string().min(5),
});

export async function updateAnnouncementAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.announcement.update({
    where: { id: parsed.data.id },
    data: { title: parsed.data.title, body: parsed.data.body },
  });

  return { ok: true as const };
}

const ToggleSchema = z.object({
  id: z.string().min(1),
  isPublished: z.boolean(),
});

export async function toggleAnnouncementPublishAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = ToggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.announcement.update({
    where: { id: parsed.data.id },
    data: { isPublished: parsed.data.isPublished },
  });

  return { ok: true as const };
}

const DeleteSchema = z.object({ id: z.string().min(1) });

export async function deleteAnnouncementAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.announcement.delete({ where: { id: parsed.data.id } });
  return { ok: true as const };
}
