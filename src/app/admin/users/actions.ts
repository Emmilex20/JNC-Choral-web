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
  isChorister: z.boolean().optional(),
  choristerVerified: z.boolean().optional(),
  adminNote: z.string().max(2000).optional(),
});

export async function updateUserAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const { id, name, role, isChorister, choristerVerified, adminNote } = parsed.data;

  const nextIsChorister =
    typeof isChorister === "boolean" ? isChorister : undefined;
  const nextVerified =
    typeof choristerVerified === "boolean" ? choristerVerified : undefined;
  const nextAdminNote =
    typeof adminNote === "string" ? adminNote.trim() : undefined;

  const enforceChorister =
    typeof nextVerified === "boolean" && nextVerified ? true : undefined;

  await prisma.user.update({
    where: { id },
    data: {
      ...(name ? { name: name.trim() } : {}),
      ...(role ? { role } : {}),
      ...(typeof nextIsChorister === "boolean" ? { isChorister: nextIsChorister } : {}),
      ...(typeof nextVerified === "boolean" ? { choristerVerified: nextVerified } : {}),
      ...(nextIsChorister === false ? { choristerVerified: false } : {}),
      ...(typeof enforceChorister === "boolean" ? { isChorister: true } : {}),
      ...(typeof nextAdminNote === "string" ? { adminNote: nextAdminNote || null } : {}),
    },
  });

  return { ok: true as const };
}

const VerifySchema = z.object({
  id: z.string().min(1),
  approved: z.boolean(),
});

export async function verifyChoristerAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return { ok: false as const, error: "Unauthorized" };

  const parsed = VerifySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  if (parsed.data.approved) {
    await prisma.user.update({
      where: { id: parsed.data.id },
      data: { isChorister: true, choristerVerified: true },
    });
  } else {
    await prisma.user.update({
      where: { id: parsed.data.id },
      data: { isChorister: false, choristerVerified: false },
    });
  }

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
