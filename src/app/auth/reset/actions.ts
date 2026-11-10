"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";

import { findUserByEmail, normalizeEmail } from "@/lib/email";
import { BCRYPT_ROUNDS, passwordSchema } from "@/lib/password";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { hashResetCode, safeEqualHex } from "@/lib/reset-code";
import { prisma } from "@/lib/prisma";

const MAX_CODE_ATTEMPTS = 5;

const ResetSchema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().regex(/^\d{6}$/),
  password: passwordSchema,
});

export async function resetPasswordAction(input: unknown) {
  const parsed = ResetSchema.safeParse(input);
  if (!parsed.success) {
    const passwordIssue = parsed.error.issues.find((i) => i.path[0] === "password");
    return {
      ok: false as const,
      error: passwordIssue ? passwordIssue.message : "Invalid data",
    };
  }

  const email = normalizeEmail(parsed.data.email);
  const ip = await getClientIp();
  const invalid = { ok: false as const, error: "Invalid or expired code" };

  const allowed =
    (await consumeRateLimit(`reset-verify:ip:${ip}`, 20, 15 * 60 * 1000)) &&
    (await consumeRateLimit(`reset-verify:email:${email}`, 10, 15 * 60 * 1000));
  if (!allowed) {
    return { ok: false as const, error: "Too many attempts. Please try again later." };
  }

  const record = await prisma.passwordReset.findFirst({
    where: { email, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.attempts >= MAX_CODE_ATTEMPTS) return invalid;

  const matches = safeEqualHex(record.codeHash, hashResetCode(email, parsed.data.code));
  if (!matches) {
    await prisma.passwordReset.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return invalid;
  }

  const user = await findUserByEmail(email);
  if (!user) return invalid;

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);

  // Claim the code atomically so it can't be redeemed twice concurrently.
  const claimed = await prisma.passwordReset.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) return invalid;

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { ok: true as const };
}
