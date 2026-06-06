import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarClock,
  Clapperboard,
  Headphones,
  KeyboardMusic,
  MapPin,
  MicVocal,
  Sparkles,
} from "lucide-react";

import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_AUDITION_ANTICIPATION_TEXT,
  getCurrentAuditionSetting,
} from "@/lib/audition-settings";
import { versionedHeroAsset } from "@/lib/site-assets";
import AuditionForm from "./ui/audition-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Auditions",
  description:
    "Register for Jude Nnam Choral auditions in Abuja. Apply as a singer, instrumentalist, or production crew.",
  alternates: {
    canonical: "https://www.jnc.vercel.app/auditions",
  },
};

const lanes = [
  {
    title: "Singers",
    body: "Soprano, alto, tenor, and bass voices ready for blend, worship, and stage confidence.",
    icon: MicVocal,
  },
  {
    title: "Instrumentalists",
    body: "Keyboard, strings, percussion, brass, and musicians who can serve the choir sound.",
    icon: KeyboardMusic,
  },
  {
    title: "Production Crew",
    body: "Media, sound, content, graphics, and backstage support for rehearsals and performances.",
    icon: Clapperboard,
  },
];

function formatAuditionDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

export default async function AuditionsPage() {
  const setting = await getCurrentAuditionSetting();
  const now = new Date();
  const hasFutureAudition =
    setting?.startsAt instanceof Date && setting.startsAt.getTime() > now.getTime();
  const anticipationText =
    setting?.anticipationText?.trim() || DEFAULT_AUDITION_ANTICIPATION_TEXT;

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteNavbar />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.14),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-amber-100/70">
              JNC Auditions
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Bring your voice, instrument, or creative skill into the sound.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
              Join Jude Nnam Choral as a singer, instrumentalist, or production
              creative. We are looking for people who are teachable, consistent,
              and ready to grow in excellence.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="rounded-2xl px-6 py-6" asChild>
                <a href="#audition-form">Start application</a>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 px-6 py-6 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/auditions/status">Track application</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
              <div className="relative aspect-video">
                <Image
                  src={versionedHeroAsset("/hero/hero-1.png")}
                  alt="Dr. Sir Jude Nnam with Jude Nnam Choral members"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.76))]" />
                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  <Sparkles className="h-4 w-4 text-amber-100" />
                  Audition season
                </div>
              </div>

              <div className="grid gap-4 border-t border-white/10 bg-black/60 p-5 sm:grid-cols-2">
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/48">
                    <CalendarClock className="h-4 w-4 text-amber-100" />
                    {hasFutureAudition ? "Next audition" : "Anticipating"}
                  </div>
                  <p className="mt-3 text-lg font-semibold leading-7 text-white">
                    {hasFutureAudition && setting?.startsAt
                      ? formatAuditionDate(setting.startsAt)
                      : "Next audition date coming soon"}
                  </p>
                </div>

                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/48">
                    <MapPin className="h-4 w-4 text-cyan-100" />
                    Venue
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    {hasFutureAudition && setting?.venue
                      ? setting.venue
                      : "Venue will be announced with the next audition date."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-emerald-100">
                  <Headphones className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {hasFutureAudition ? "Prepare with confidence" : "Stay ready"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/66">
                    {hasFutureAudition
                      ? setting?.note ||
                        "Come prepared, confident, and ready to grow with the choir."
                      : anticipationText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {lanes.map((lane) => {
            const Icon = lane.icon;
            return (
              <article
                key={lane.title}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-amber-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-white">
                  {lane.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/65">{lane.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="audition-form"
        className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 md:px-6 md:pb-24 lg:grid-cols-[0.72fr_1fr] lg:items-start"
      >
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">
            Before you apply
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Simple, focused, and human.
          </h2>
          <div className="mt-6 grid gap-4 text-sm leading-7 text-white/68">
            <p>
              Use the form to tell us who you are and where you want to serve.
              Singers can choose a voice part, instrumentalists can list their
              instrument, and production applicants can share a role or portfolio.
            </p>
            <p>
              You need an account to submit, so your application can be tracked
              from your status page after registration.
            </p>
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
      </section>

      <SiteFooter />
    </main>
  );
}
