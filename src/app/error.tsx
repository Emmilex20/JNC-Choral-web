"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center bg-black px-4 text-white"
    >
      <div className="max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-100/70">
          Something went wrong
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
          This page could not load
        </h1>
        <p className="mt-4 text-base leading-7 text-white/70">
          This is a problem on our side. Please try again. If it keeps happening, contact us.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-white/40">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button className="rounded-2xl bg-amber-300 font-semibold text-black hover:bg-amber-200" onClick={reset}>
            Try again
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            <Link href="/">Go to the homepage</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
