"use server";

import { z } from "zod";
import crypto from "crypto";

import { findUserByEmail, normalizeEmail } from "@/lib/email";
import { sendMail } from "@/lib/mailer";
import { hashResetCode } from "@/lib/reset-code";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const ForgotSchema = z.object({
  email: z.string().trim().email().max(254),
});

const GENERIC_OK = { ok: true as const };

export async function requestPasswordResetAction(input: unknown) {
  const parsed = ForgotSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid email" };
  }

  const email = normalizeEmail(parsed.data.email);
  const ip = await getClientIp();

  const allowed =
    (await consumeRateLimit(`reset-request:ip:${ip}`, 10, 60 * 60 * 1000)) &&
    (await consumeRateLimit(`reset-request:email:${email}`, 3, 60 * 60 * 1000));
  if (!allowed) {
    return {
      ok: false as const,
      error: "Too many requests. Please try again later.",
    };
  }

  const user = await findUserByEmail(email);
  // Same response whether or not the account exists, to avoid enumeration.
  if (!user || !user.passwordHash) return GENERIC_OK;

  const code = String(crypto.randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Only the newest code is valid.
  await prisma.passwordReset.updateMany({
    where: { email, usedAt: null },
    data: { usedAt: new Date() },
  });
  await prisma.passwordReset.create({
    data: { email, codeHash: hashResetCode(email, code), expiresAt },
  });

  await sendMail({
    to: user.email!,
    subject: "Your JNC password reset code",
    text: `Your password reset code is ${code}. It expires in 15 minutes. If you did not request this, you can ignore this email.`,
  });

  return GENERIC_OK;
}
