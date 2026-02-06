import type { MetadataRoute } from "next";

const siteUrl = "https://www.jnc-choral.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes = [
    "",
    "/about",
    "/auditions",
    "/events",
    "/news",
    "/gallery",
    "/music",
    "/videos",
    "/contact",
    "/auth/login",
    "/auth/register",
    "/auth/forgot",
    "/auth/reset",
    "/profile",
  ];

  return routes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
