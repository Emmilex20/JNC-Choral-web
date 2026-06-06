import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/profile",
          "/onboarding",
          "/auditions/status",
          "/auth/forgot",
          "/auth/reset",
        ],
      },
    ],
    sitemap: "https://www.jnc.vercel.app/sitemap.xml",
  };
}
