import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

export function ipFromHeaders(get: (name: string) => string | null | undefined) {
  const forwarded = get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || get("x-real-ip")?.trim() || "unknown";
}

export async function getClientIp() {
  const h = await headers();
  return ipFromHeaders((name) => h.get(name));
}

/**
 * Database-backed sliding-window limiter, so limits hold across serverless
 * instances. Returns true when the action is allowed (and records the hit),
 * false when the limit has been reached.
 */
export async function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const since = new Date(Date.now() - windowMs);
  try {
    const count = await prisma.rateLimitHit.count({
      where: { key, createdAt: { gt: since } },
    });
    if (count >= limit) return false;

    await prisma.rateLimitHit.create({ data: { key } });

    // Opportunistic cleanup keeps the table small.
    if (Math.random() < 0.02) {
      await prisma.rateLimitHit.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      });
    }
    return true;
  } catch (error) {
    // Fail open if the table is missing (migration not applied yet) so the
    // site keeps working, but make the problem visible in logs.
    console.error("[rate-limit] check failed", error);
    return true;
  }
}

/** Check without recording a hit (used to block after repeated failures). */
export async function isRateLimited(key: string, limit: number, windowMs: number) {
  try {
    const count = await prisma.rateLimitHit.count({
      where: { key, createdAt: { gt: new Date(Date.now() - windowMs) } },
    });
    return count >= limit;
  } catch (error) {
    console.error("[rate-limit] check failed", error);
    return false;
  }
}

export async function recordRateLimitHit(key: string) {
  try {
    await prisma.rateLimitHit.create({ data: { key } });
  } catch (error) {
    console.error("[rate-limit] record failed", error);
  }
}

export async function clearRateLimit(key: string) {
  try {
    await prisma.rateLimitHit.deleteMany({ where: { key } });
  } catch (error) {
    console.error("[rate-limit] clear failed", error);
  }
}
