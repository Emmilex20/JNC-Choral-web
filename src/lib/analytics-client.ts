import type { AnalyticsEventName } from "@/lib/analytics";

/**
 * Fire-and-forget anonymous event. Safe to call anywhere on the client; it
 * silently does nothing if the browser asks not to be tracked or blocks it.
 */
export function trackEvent(name: AnalyticsEventName, path?: string, referrer?: string) {
  try {
    if (typeof window === "undefined") return;
    if (navigator.doNotTrack === "1") return;

    const payload = JSON.stringify({
      name,
      path: path ?? window.location.pathname,
      referrer,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "text/plain" }));
    } else {
      void fetch("/api/analytics", {
        method: "POST",
        body: payload,
        keepalive: true,
        headers: { "Content-Type": "text/plain" },
      });
    }
  } catch {
    // Never let analytics affect the page.
  }
}
