export type CspMode = "enforce" | "report-only";

export function getCspMode(value = process.env.CSP_MODE): CspMode {
  return value === "enforce" ? "enforce" : "report-only";
}

export function buildCsp(nonce: string, isDev = process.env.NODE_ENV !== "production") {
  const cloudinary = "https://res.cloudinary.com";
  const directives = [
    "default-src 'self'",
    // 'strict-dynamic' lets nonce-approved scripts load their own chunks.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline styles are required by Next.js, framer-motion and Tailwind runtime styles.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${cloudinary} https://lh3.googleusercontent.com`,
    `media-src 'self' blob: ${cloudinary}`,
    "font-src 'self' data:",
    `connect-src 'self' blob: ${cloudinary} https://api.cloudinary.com`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
  ];
  return directives.join("; ");
}
