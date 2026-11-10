import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "jnc.vercel.app" }],
        destination: "https://www.jncchorale.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.jnc.vercel.app" }],
        destination: "https://www.jncchorale.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "jncchorale.com" }],
        destination: "https://www.jncchorale.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Directives that are safe to enforce without breaking inline scripts
          // (Next.js, Google sign-in, Cloudinary). A full script-src policy needs
          // per-request nonces, which would make every page dynamic.
          {
            key: "Content-Security-Policy",
            value: "object-src 'none'; base-uri 'self'; frame-ancestors 'self'",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          // Microphone is needed for sight-singing practice.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
  images: {
    localPatterns: [
      { pathname: "/**", search: "" },
      { pathname: "/**", search: "?v=20260606" },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
