"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CirclePlay,
  Clapperboard,
  Film,
  Sparkles,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Item = {
  id: string;
  title: string | null;
  videoUrl: string;
  posterUrl: string | null;
  createdAt: string;
};

const mediaPoster = "/hero/hero-2.png";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function VideosClient({ items }: { items: Item[] }) {
  const featured = items[0] ?? null;
  const rest = items.slice(1);

  if (!featured) {
    return (
      <section id="screening-room" className="mt-10 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
          <Film className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-white">
          No videos have been published yet.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/62">
          Performance videos, rehearsal clips, and highlight reels will appear here when the
          admin team uploads them.
        </p>
        <Button className="mt-6 rounded-2xl bg-amber-200 text-black hover:bg-amber-100" asChild>
          <Link href="/contact">
            Contact media desk
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    );
  }

  return (
    <div className="mt-10 space-y-10">
      <section id="screening-room" className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045]">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <div className="bg-black">
            <video
              className="aspect-video w-full bg-black object-cover"
              controls
              playsInline
              preload="none"
              poster={featured.posterUrl ?? mediaPoster}
              src={featured.videoUrl}
            />
          </div>
          <div className="p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-50">
              <CirclePlay className="h-4 w-4" />
              Now showing
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
              {featured.title ?? "JNC video highlight"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/62">
              Published {formatDate(featured.createdAt)}. Watch the latest JNC performance,
              rehearsal, or behind-the-scenes release.
            </p>

            <div className="mt-7 grid gap-3">
              {[
                {
                  label: "Archive",
                  value: `${items.length} video${items.length === 1 ? "" : "s"}`,
                  icon: Video,
                },
                {
                  label: "Focus",
                  value: "Performances and stories",
                  icon: Clapperboard,
                },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-[1.25rem] border border-white/10 bg-black/24 p-4"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                      <Icon className="h-4 w-4 text-amber-100" />
                      {stat.label}
                    </div>
                    <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {rest.length > 0 ? (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/62">
                Video Archive
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                More highlights
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/58">
              Recent public uploads are arranged from newest to oldest.
            </p>
          </div>

          <motion.div
            className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {rest.map((videoItem) => (
              <motion.article
                key={videoItem.id}
                variants={item}
                className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/24"
              >
                <video
                  className="aspect-video w-full bg-black object-cover"
                  controls
                  playsInline
                  preload="none"
                  poster={videoItem.posterUrl ?? mediaPoster}
                  src={videoItem.videoUrl}
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/62">
                    <Sparkles className="h-3.5 w-3.5" />
                    {formatDate(videoItem.createdAt)}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white">
                    {videoItem.title ?? "JNC video highlight"}
                  </h3>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(251,191,36,0.14),rgba(6,182,212,0.08),rgba(255,255,255,0.04))] p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/24 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              <Film className="h-4 w-4 text-amber-100" />
              Media story
            </div>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white">
              Want to see the still moments too?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/64">
              The gallery carries concert images, rehearsal frames, posters, and backstage
              memories alongside the video archive.
            </p>
          </div>
          <div className="relative min-h-[220px] overflow-hidden rounded-[1.25rem] bg-black">
            <Image
              src="/hero/hero-3.png"
              alt="Jude Nnam Choral media preview"
              fill
              sizes="(max-width: 1024px) 100vw, 300px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/34" />
            <Link
              href="/gallery"
              className="absolute inset-x-5 bottom-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Open gallery
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
