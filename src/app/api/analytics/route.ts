
import {
  isAnalyticsEvent,
  isBot,
  normalizePath,
  referrerHost,
  visitorHash,
} from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, ipFromHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const RETENTION_DAYS = 400;
const NO_CONTENT = new Response(null, { status: 204 });

/**
 * Cookieless, IP-free analytics endpoint. It stores the event name, a clean
 * path, the referring hostname and a daily-rotating anonymous visitor hash.
 */
export async function POST(request: Request) {
  // Honour Do Not Track and ignore bots.
  if (request.headers.get("dnt") === "1") return NO_CONTENT;
  const userAgent = request.headers.get("user-agent");
  if (isBot(userAgent)) return NO_CONTENT;

  // Same-site requests only, so other sites cannot stuff the table.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin) {
    try {
      if (new URL(origin).host !== host) return NO_CONTENT;
    } catch {
      return NO_CONTENT;
    }
  }

  let body: { name?: unknown; path?: unknown; referrer?: unknown } | null = null;
  try {
    const text = await request.text();
    if (text.length > 2000) return NO_CONTENT;
    body = JSON.parse(text);
  } catch {
    return NO_CONTENT;
  }

  const path = normalizePath(body?.path);
  if (!body || !isAnalyticsEvent(body.name) || !path) return NO_CONTENT;
  if (path.startsWith("/admin") || path.startsWith("/api")) return NO_CONTENT;

  const ip = ipFromHeaders((name) => request.headers.get(name));
  const visitor = visitorHash(ip, userAgent ?? "");

  // A real visitor never needs this many events in an hour.
  if (!(await consumeRateLimit(`analytics:${visitor}`, 600, 60 * 60 * 1000))) {
    return NO_CONTENT;
  }

  try {
    await prisma.analyticsEvent.create({
      data: {
        name: body.name,
        path,
        referrer: body.name === "pageview" ? referrerHost(body.referrer, host) : null,
        visitor,
      },
    });

    // Opportunistic retention: drop events older than ~13 months.
    if (Math.random() < 0.01) {
      await prisma.analyticsEvent.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000) } },
      });
    }
  } catch (error) {
    // Analytics must never break the site (e.g. table not migrated yet).
    console.error("[analytics] write failed", error);
  }

  return NO_CONTENT;
}
