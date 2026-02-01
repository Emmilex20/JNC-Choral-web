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
  description: z.string().optional(),
  location: z.string().optional(),
  startsAt: z.string().min(1), // datetime-local string
  endsAt: z.string().optional(),
});

export async function createEventAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const d = parsed.data;

  await prisma.event.create({
    data: {
      title: d.title,
      description: d.description?.trim() || null,
      location: d.location?.trim() || null,
      startsAt: new Date(d.startsAt),
      endsAt: d.endsAt?.trim() ? new Date(d.endsAt) : null,
      isPublished: false,
    },
  });

  return { ok: true as const };
}

const UpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().optional(),
});

export async function updateEventAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const d = parsed.data;

  await prisma.event.update({
    where: { id: d.id },
    data: {
      title: d.title,
      description: d.description?.trim() || null,
      location: d.location?.trim() || null,
      startsAt: new Date(d.startsAt),
      endsAt: d.endsAt?.trim() ? new Date(d.endsAt) : null,
    },
  });

  return { ok: true as const };
}

const ToggleSchema = z.object({
  id: z.string().min(1),
  isPublished: z.boolean(),
});

export async function toggleEventPublishAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = ToggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.event.update({
    where: { id: parsed.data.id },
    data: { isPublished: parsed.data.isPublished },
  });

  return { ok: true as const };
}

const DeleteSchema = z.object({ id: z.string().min(1) });

export async function deleteEventAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.event.delete({ where: { id: parsed.data.id } });
  return { ok: true as const };
}
