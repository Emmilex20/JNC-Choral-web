"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(64),
  isChorister: z.boolean().optional(),
});

export async function registerUserAction(input: unknown) {
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid data" };
  }

  const { name, email, password, isChorister } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false as const, error: "Email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      role: "USER",
      isChorister: Boolean(isChorister),
      choristerVerified: false,
      onboardingComplete: false,
    },
  });

  return { ok: true as const };
}
