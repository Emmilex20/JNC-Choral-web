import type { Metadata } from "next";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Jude Nnam Choral in Abuja. We respond to inquiries about auditions, events, and collaborations.",
  alternates: {
    canonical: "https://www.jnc-choral.vercel.app/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">
              Contact
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              Let&apos;s connect
            </h1>
            <p className="mt-3 text-white/70">
              Reach out for auditions, events, partnerships, or media requests.
              We&apos;ll respond as quickly as possible.
            </p>

            <div className="mt-6 grid gap-4 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-white/60">Location</p>
                <p className="text-white">Abuja, Nigeria</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-white/60">Phone</p>
                <p className="text-white">08064087399</p>
                <p className="text-white">0803943856</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-white/60">Email</p>
                <p className="text-white">jncplatform@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
            <h2 className="text-2xl font-semibold text-white">Send a message</h2>
            <p className="mt-2 text-sm text-white/70">
              Prefer email? We&apos;ll respond within 24–48 hours.
            </p>

            <div className="mt-6 grid gap-3">
              <input
                placeholder="Your name"
                className="rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              />
              <input
                placeholder="Email"
                type="email"
                className="rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              />
              <textarea
                placeholder="Message"
                className="min-h-32 rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              />
              <Button className="rounded-2xl" asChild>
                <Link href="mailto:jncplatform@gmail.com">Send email</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),transparent_60%)] p-8 md:p-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Interested in auditions?
              </h2>
              <p className="mt-2 text-white/70">
                Apply online and we&apos;ll contact you with next steps.
              </p>
            </div>
            <Button className="rounded-2xl" asChild>
              <Link href="/auditions">Register for auditions</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
