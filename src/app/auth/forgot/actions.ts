"use server";

import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const ForgotSchema = z.object({
  email: z.string().email(),
});

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function requestPasswordResetAction(input: unknown) {
  const parsed = ForgotSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid email" };
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Avoid user enumeration
    return { ok: true as const };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.passwordReset.create({
    data: { email, codeHash, expiresAt },
  });

  // TODO: send code via email. For now we return it for display.
  return { ok: true as const, code };
}
