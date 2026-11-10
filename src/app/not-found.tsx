import Link from "next/link";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { Button } from "@/components/ui/button";

const suggestions = [
  { label: "Home", href: "/" },
  { label: "Auditions", href: "/auditions" },
  { label: "Events", href: "/events" },
  { label: "Music Hub", href: "/music-hub" },
  { label: "Help & FAQ", href: "/help" },
  { label: "Contact", href: "/contact" },
];

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-black text-white">
      <SiteNavbar />
      <section className="mx-auto max-w-3xl px-4 py-24 text-center md:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-100/70">Error 404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
          We can&apos;t find that page
        </h1>
        <p className="mt-4 text-base leading-7 text-white/70">
          The link may be old or mistyped. Try one of these instead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {suggestions.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="outline"
              className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
