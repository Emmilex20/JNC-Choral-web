import type { MetadataRoute } from "next";

import { listPublicScoreSheets } from "@/lib/music-sheets";

const siteUrl = "https://www.jnc-choral.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const routes = [
    "",
    "/about",
    "/auditions",
    "/events",
    "/news",
    "/scores",
    "/gallery",
    "/music",
    "/videos",
    "/contact",
    "/privacy-policy",
    "/terms-of-service",
    "/cookie-policy",
  ];

  const scores = await listPublicScoreSheets();

  return [
    ...routes.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/scores" ? 0.85 : 0.6,
    })),
    ...scores.map((score) => ({
      url: `${siteUrl}/scores/${score.slug}`,
      lastModified: score.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
