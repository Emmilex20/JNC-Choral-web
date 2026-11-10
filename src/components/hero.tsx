"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { versionedHeroAsset } from "@/lib/site-assets";
import type { AuditionBanner } from "@/lib/audition-banner";

type Slide = {
  src: string;
  title: string;
  subtitle: string;
  fit: string;
  position: string;
};

function buildSlides(audition: AuditionBanner): Slide[] {
  return [
    {
      src: versionedHeroAsset("/hero/hero-1.png"),
      title: audition.state === "upcoming" ? `Auditions ${audition.year}` : "Next auditions coming soon",
      subtitle: "S/A/T/B - Instrumentalists - Production",
      fit: "cover",
      position: "center",
    },
    ...baseSlides,
  ];
}

const baseSlides: Slide[] = [
  {
    src: versionedHeroAsset("/hero/hero1.jpg"),
    title: "Jude Nnam Chorale Platform",
    subtitle: "Spreading joy through music",
    fit: "contain",
    position: "top center",
  },
  {
    src: versionedHeroAsset("/hero/hero-2.png"),
    title: "Voices. Strings. Stories.",
    subtitle: "A community built on excellence",
    fit: "cover",
    position: "center",
  },
];

export default function Hero({ audition }: { audition: AuditionBanner }) {
  const slides = useMemo(() => buildSlides(audition), [audition]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    // Respect users who ask for reduced motion: no auto-advancing slides.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const activeSlide = slides[active];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="absolute inset-0 bg-no-repeat"
            style={{
              backgroundImage: `url(${activeSlide.src})`,
              backgroundSize: activeSlide.fit ?? "cover",
              backgroundPosition: activeSlide.position ?? "center",
            }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(253,230,138,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_60%)]" />
        <div className="absolute -top-28 left-1/2 h-80 w-160 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.22),transparent_60%)] blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                {audition.state === "upcoming" ? "Auditions - Abuja" : "Jude Nnam Chorale - Abuja"}
              </Badge>
              {audition.state === "upcoming" ? (
                <span className="text-xs text-white/80">{audition.dateLabel}</span>
              ) : null}
            </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-6xl">
            {activeSlide.title}
          </h1>

          <p className="mt-3 text-lg text-white/90 md:text-xl">
            {activeSlide.subtitle}
          </p>

          <p className="mt-5 text-base leading-relaxed text-white/75 md:text-lg">
            Join Jude Nnam Chorale Platform as a singer, instrumentalist, or production crew.
            Experience excellence, community, and growth.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="rounded-2xl" asChild>
              <Link href="/auditions">
                {audition.state === "upcoming" ? "Register for Auditions" : "Audition details"}
              </Link>
            </Button>

            <Button
              variant="outline"
              className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/about">Learn more</Link>
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-2.5 w-2.5 rounded-full border border-white/40 transition ${
                  i === active ? "bg-white" : "bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Show slide ${i + 1}`}
              />
            ))}
          </div>

            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { k: "S/A/T/B", v: "Singers" },
                { k: "Keys/Strings", v: "Instrumentalists" },
                { k: "Media", v: "Production Crew" },
                { k: "Abuja", v: "Location" },
              ].map((x) => (
                <div
                  key={x.k}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-lg font-semibold text-white">{x.k}</p>
                  <p className="text-xs text-white/70">{x.v}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6"
            >
              <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(234,179,8,0.12),transparent_45%)]" />
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.2),transparent_60%)]" />
              <div className="relative">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Next auditions
                </p>
                {audition.state === "upcoming" ? (
                  <>
                    <h3 className="mt-3 text-2xl font-semibold text-white">
                      {audition.dateLabel}
                    </h3>
                    <p className="mt-2 text-sm text-white/70">
                      {audition.venue ?? "Abuja, Nigeria"}
                    </p>
                    {audition.note ? (
                      <p className="mt-3 text-sm leading-6 text-white/70">{audition.note}</p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <h3 className="mt-3 text-2xl font-semibold text-white">
                      Dates will be announced soon
                    </h3>
                    <p className="mt-2 text-sm text-white/70">
                      Keep rehearsing and check back. Create an account to be ready when
                      the next call opens.
                    </p>
                  </>
                )}

                <ul className="mt-6 grid gap-3 text-sm text-white/80">
                  {[
                    "Singers: soprano, alto, tenor and bass",
                    "Instrumentalists: keys, strings, percussion, brass",
                    "Production crew: media, sound, graphics, stage",
                  ].map((line) => (
                    <li
                      key={line}
                      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
                    >
                      {line}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    asChild
                  >
                    <Link href={audition.state === "upcoming" ? "/auditions" : "/auth/register"}>
                      {audition.state === "upcoming" ? "See how to apply" : "Create an account"}
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
