import type { Metadata } from "next";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import AuditionForm from "./ui/audition-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Auditions",
  description:
    "Register for Jude Nnam Choral auditions in Abuja. Apply as a singer, instrumentalist, or production crew.",
  alternates: {
    canonical: "https://www.jnc-choral.vercel.app/auditions",
  },
};

export default function AuditionsPage() {
  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="grid gap-8 md:grid-cols-2 md:items-start">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Auditions Registration
            </h1>
            <p className="mt-3 text-white/70">
              Join as a <b className="text-white">Singer</b>,{" "}
              <b className="text-white">Instrumentalist</b>, or{" "}
              <b className="text-white">Production Crew</b>.
            </p>

            <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-white/80">
              <p>
                <span className="text-white font-semibold">Time:</span> 3:30pm
              </p>
              <p>
                <span className="text-white font-semibold">Dates:</span> 1st & 8th Feb, 2026
              </p>
              <p>
                <span className="text-white font-semibold">Venue:</span> Catholic Secretariat, Durumi, Abuja
              </p>
              <p className="text-white/70">
                Come with confidence — we’re here to help you shine.
              </p>
            </div>

            <div className="mt-6 text-xs text-white/60">
              By submitting, you agree that your details may be used to contact you about the audition.
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/auditions/status">Track your application</Link>
              </Button>
            </div>
          </div>

          <AuditionForm />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
