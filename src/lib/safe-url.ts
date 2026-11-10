/** Returns the URL only if it is http(s); otherwise "#" so stored javascript: links are inert. */
export function safeHttpUrl(value: string | null | undefined) {
  if (!value) return "#";
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "#";
  } catch {
    return "#";
  }
}
