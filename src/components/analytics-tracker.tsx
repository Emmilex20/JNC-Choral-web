"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { trackEvent } from "@/lib/analytics-client";

/** Sends one anonymous pageview per navigation. No cookies, no storage. */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const isFirstView = useRef(true);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    if (pathname.startsWith("/admin")) return;
    lastPath.current = pathname;
    // The referrer is only meaningful for the visit that first loaded the site.
    trackEvent("pageview", pathname, isFirstView.current ? document.referrer : undefined);
    isFirstView.current = false;
  }, [pathname]);

  return null;
}
