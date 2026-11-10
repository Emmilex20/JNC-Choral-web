/** Only allow same-site relative paths ("/foo"), never "//host", "/\host" or schemes like javascript:. */
export function safeCallbackUrl(raw: string | null | undefined, fallback = "/") {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(raw)) return fallback;
  return raw;
}
