import crypto from "crypto";

/** Every event name the API will accept. Anything else is dropped. */
export const ANALYTICS_EVENTS = [
  "pageview",
  "audition_form_view",
  "audition_step_2",
  "audition_step_3",
  "audition_submitted",
  "signup_completed",
  "quiz_completed",
  "daily_challenge_played",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEvent(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && (ANALYTICS_EVENTS as readonly string[]).includes(value);
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|headless|lighthouse|pingdom|monitor|preview|facebookexternalhit|curl|wget|python-requests|axios|node-fetch/i;

export function isBot(userAgent: string | null | undefined) {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

/** Keeps only a clean pathname: no query string, no hash, bounded length. */
export function normalizePath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  const path = value.split(/[?#]/)[0];
  if (path.length === 0 || path.length > 200) return null;
  if (!/^[A-Za-z0-9\-._~%/@:+]*$/.test(path)) return null;
  // Collapse ids so every quiz result or score slug does not become its own row.
  const trimmed = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return trimmed;
}

/** Reduces a referrer URL to its hostname, ignoring the site itself. */
export function referrerHost(referrer: unknown, ownHost: string | null) {
  if (typeof referrer !== "string" || referrer.length === 0) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (!host) return null;
    if (ownHost && host === ownHost.replace(/^www\./, "").split(":")[0]) return null;
    return host.slice(0, 100);
  } catch {
    return null;
  }
}

function secret() {
  const value = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!value) throw new Error("NEXTAUTH_SECRET (or AUTH_SECRET) must be set");
  return value;
}

/**
 * Anonymous per-day visitor id: HMAC(secret, day + ip + user agent). The day is
 * part of the input, so the same person gets a different id tomorrow.
 */
export function visitorHash(ip: string, userAgent: string, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  return crypto
    .createHmac("sha256", secret())
    .update(`${day}|${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}
