"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

function requireAdmin(session: any) {
  return session?.user && (session.user as any).role === "ADMIN";
}

const UpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export async function updateUserAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const { id, name, role } = parsed.data;

  await prisma.user.update({
    where: { id },
    data: {
      ...(name ? { name: name.trim() } : {}),
      ...(role ? { role } : {}),
    },
  });

  return { ok: true as const };
}

const DeleteSchema = z.object({ id: z.string().min(1) });

export async function deleteUserAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.user.delete({ where: { id: parsed.data.id } });
  return { ok: true as const };
}
