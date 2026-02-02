"use server";

import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ResetSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
  password: z.string().min(6).max(64),
});

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function resetPasswordAction(input: unknown) {
  const parsed = ResetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid data" };
  }

  const email = parsed.data.email.toLowerCase();
  const codeHash = hashCode(parsed.data.code);

  const record = await prisma.passwordReset.findFirst({
    where: {
      email,
      codeHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { ok: false as const, error: "Invalid or expired code" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true as const };
}
