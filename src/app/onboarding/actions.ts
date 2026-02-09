"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const OnboardingSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  stateOfOrigin: z.string().max(60).optional(),
  currentParish: z.string().max(120).optional(),
  isChorister: z.boolean().optional(),
});

export async function completeOnboardingAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  const parsed = OnboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name.trim(),
      onboardingComplete: true,
      isChorister: Boolean(parsed.data.isChorister),
      choristerVerified: parsed.data.isChorister ? false : false,
      profile: {
        upsert: {
          create: {
            phone: parsed.data.phone?.trim() || null,
            address: parsed.data.address?.trim() || null,
            stateOfOrigin: parsed.data.stateOfOrigin?.trim() || null,
            currentParish: parsed.data.currentParish?.trim() || null,
          },
          update: {
            phone: parsed.data.phone?.trim() || null,
            address: parsed.data.address?.trim() || null,
            stateOfOrigin: parsed.data.stateOfOrigin?.trim() || null,
            currentParish: parsed.data.currentParish?.trim() || null,
          },
        },
      },
    },
  });

  return { ok: true as const };
}
