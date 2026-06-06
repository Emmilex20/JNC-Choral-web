"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Cookie, Settings2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

type ConsentChoice = "pending" | "essential" | "all";

const STORAGE_KEY = "jnc_cookie_consent";
const CONSENT_EVENT = "jnc-cookie-consent";

function readConsent(): ConsentChoice {
  if (typeof window === "undefined") return "pending";

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "essential" || value === "all" ? value : "pending";
  } catch {
    return "pending";
  }
}

function subscribeToConsent(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", callback);
  window.addEventListener(CONSENT_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CONSENT_EVENT, callback);
  };
}

function saveConsent(choice: Exclude<ConsentChoice, "pending">) {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } finally {
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }
}

export default function CookieConsent() {
  const consent = useSyncExternalStore(
    subscribeToConsent,
    readConsent,
    () => "all" as ConsentChoice
  );
  const [showDetails, setShowDetails] = useState(false);

  function choose(choice: Exclude<ConsentChoice, "pending">) {
    saveConsent(choice);
    setShowDetails(false);
  }

  if (consent !== "pending") return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-3xl rounded-[1.5rem] border border-white/10 bg-[#05070d]/95 p-4 text-white shadow-[0_26px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl md:p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-amber-100">
          <Cookie className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Cookie preferences</p>
              <p className="mt-1 text-sm leading-6 text-white/68">
                We use essential cookies for secure login, protected downloads, and site
                security. Optional cookies may support analytics or embedded media only after
                consent.
              </p>
            </div>
          </div>

          {showDetails ? (
            <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 text-sm leading-6 text-white/66 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-200" />
                  Essential
                </div>
                <p className="mt-1">
                  Required for authentication, account sessions, consent storage, security,
                  and protected platform features.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Settings2 className="h-4 w-4 text-amber-100" />
                  Optional
                </div>
                <p className="mt-1">
                  May be used later for analytics, performance, or embedded media. The site
                  works without these.
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              onClick={() => choose("all")}
              className="rounded-2xl bg-amber-200 text-black hover:bg-amber-100"
            >
              Accept all
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => choose("essential")}
              className="rounded-2xl border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
            >
              Essential only
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDetails((current) => !current)}
              className="rounded-2xl text-white/78 hover:bg-white/[0.08] hover:text-white"
            >
              {showDetails ? "Hide details" : "Manage choices"}
            </Button>
            <Link
              href="/cookie-policy"
              className="text-sm font-medium text-amber-100 underline-offset-4 hover:underline"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
