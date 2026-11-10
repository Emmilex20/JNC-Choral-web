"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";

import { findUserByEmail, normalizeEmail } from "@/lib/email";
import { BCRYPT_ROUNDS, passwordSchema } from "@/lib/password";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: passwordSchema,
  isChorister: z.boolean().optional(),
});

export async function registerUserAction(input: unknown) {
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) {
    const passwordIssue = parsed.error.issues.find((i) => i.path[0] === "password");
    return {
      ok: false as const,
      error: passwordIssue ? passwordIssue.message : "Invalid data",
    };
  }

  const ip = await getClientIp();
  if (!(await consumeRateLimit(`register:ip:${ip}`, 10, 60 * 60 * 1000))) {
    return { ok: false as const, error: "Too many sign-ups. Please try again later." };
  }

  const { name, password, isChorister } = parsed.data;
  const email = normalizeEmail(parsed.data.email);

  const existing = await findUserByEmail(email);
  if (existing) {
    return { ok: false as const, error: "Email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER",
        isChorister: Boolean(isChorister),
        choristerVerified: false,
        onboardingComplete: false,
      },
    });
  } catch (error) {
    // Lost a race with a concurrent sign-up for the same email (unique index).
    if ((error as { code?: string }).code === "P2002") {
      return { ok: false as const, error: "Email already exists" };
    }
    throw error;
  }

  return { ok: true as const };
}
