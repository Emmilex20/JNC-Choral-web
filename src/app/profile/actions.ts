"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const ProfileSchema = z.object({
  name: z.string().min(2).max(80),
  image: z.string().url().optional().or(z.literal("")),
});

export async function updateProfileAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid data" };
  }

  const { name, image } = parsed.data;

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name.trim(),
        image: image?.trim() || null,
      },
    });
    revalidatePath("/profile");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Failed to update profile" };
  }
}
