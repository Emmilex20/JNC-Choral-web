"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth";
import { z } from "zod";
import { getServerSession } from "next-auth";

const Schema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "SHORTLISTED", "ACCEPTED", "REJECTED"]),
});

export async function updateAuditionStatusAction(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { ok: false as const, error: "Unauthorized" };
  }

  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input" };
  }

  try {
    await prisma.auditionApplication.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Failed to update status" };
  }
}
