"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Download,
  FileText,
  Headphones,
  Library,
  Lock,
  MicVocal,
  Music2,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Item = {
  id: string;
  title: string | null;
  audioUrl: string;
  createdAt: string;
};

type Sheet = {
  id: string;
  title: string | null;
  slug: string;
  composer: string;
  fileName: string;
  audience: "ALL_USERS" | "CHORISTERS_ONLY";
  createdAt: string;
  downloadUrl: string;
};

const mediaPoster = "/hero/hero-1.png";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const featureCards = [
  {
    title: "Worship recordings",
    body: "Music for devotion, rehearsal, reference, and sharing the JNC sound.",
    icon: MicVocal,
  },
  {
    title: "Live moments",
    body: "Concert, rehearsal, and ministry recordings arranged from newest to oldest.",
    icon: Radio,
  },
  {
    title: "Study files",
    body: "Scores and sheets stay protected while public titles remain discoverable.",
    icon: Library,
  },
];

function audienceLabel(audience: Sheet["audience"]) {
  return audience === "CHORISTERS_ONLY" ? "Choristers only" : "All signed-in users";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function MusicClient({
  items,
  sheets,
  isSignedIn,
  canAccessChoristerSheets,
}: {
  items: Item[];
  sheets: Sheet[];
  isSignedIn: boolean;
  canAccessChoristerSheets: boolean;
}) {
  const featuredTrack = items[0] ?? null;
  const otherTracks = items.slice(1);

  return (
    <div className="space-y-10">
      <motion.div
        className="grid gap-4 md:grid-cols-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {featureCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.title}
              variants={item}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 transition hover:border-amber-200/25 hover:bg-white/[0.065]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/62">{card.body}</p>
            </motion.article>
          );
        })}
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <section id="latest-releases" className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045]">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative min-h-[320px] bg-black">
              <Image
                src={mediaPoster}
                alt="Jude Nnam Choral music cover"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.03),rgba(0,0,0,0.84))]" />
              <div className="absolute bottom-5 left-5 right-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/54 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/82 backdrop-blur">
                  <Headphones className="h-4 w-4 text-amber-100" />
                  Listening Room
                </div>
                <p className="mt-4 max-w-sm text-2xl font-semibold text-white">
                  Stream JNC releases directly from the platform.
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/62">
                Featured Track
              </p>
              {featuredTrack ? (
                <>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                    {featuredTrack.title ?? "Untitled Track"}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-white/58">
                    Uploaded {formatDate(featuredTrack.createdAt)}. Use the player below for
                    listening, rehearsal, and reference.
                  </p>
                  <audio
                    className="mt-7 w-full"
                    controls
                    preload="metadata"
                    src={featuredTrack.audioUrl}
                  />
                </>
              ) : (
                <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-black/24 p-5">
                  <Music2 className="h-6 w-6 text-amber-100" />
                  <h2 className="mt-4 text-2xl font-semibold text-white">
                    No music uploaded yet.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-white/62">
                    Public tracks added by the admin team will appear here when they are ready.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.035))] p-6 md:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                Score Access
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Choir scripts and sheets
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/62">
                Download charts, scripts, and arrangements based on your account access.
              </p>
            </div>
            <FileText className="h-5 w-5 text-amber-100/70" />
          </div>

          {!isSignedIn ? (
            <div className="mt-7 rounded-[1.25rem] border border-amber-200/20 bg-amber-200/10 p-5 text-sm text-amber-50">
              <div className="flex items-center gap-2 font-semibold">
                <Lock className="h-4 w-4" />
                Registration required
              </div>
              <p className="mt-3 leading-7 text-amber-50/82">
                Listening is open. Downloading sheets requires a registered account, and
                chorister-only files require verification.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button className="rounded-2xl bg-amber-200 text-black hover:bg-amber-100" asChild>
                  <Link href="/auth/register?callbackUrl=/music">Create account</Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl border-amber-100/20 bg-black/24 text-amber-50 hover:bg-black/36"
                  asChild
                >
                  <Link href="/auth/login?callbackUrl=/music">Member sign in</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/70">
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5">
                  {sheets.length} file{sheets.length === 1 ? "" : "s"} available
                </span>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5">
                  {canAccessChoristerSheets ? "Chorister files included" : "General files only"}
                </span>
              </div>

              <div className="mt-6 grid gap-3">
                {sheets.length === 0 ? (
                  <div className="rounded-[1.25rem] border border-white/10 bg-black/24 p-5 text-sm leading-7 text-white/60">
                    No sheet files are available for your account yet.
                  </div>
                ) : (
                  sheets.map((sheet) => (
                    <motion.article
                      key={sheet.id}
                      variants={item}
                      initial="hidden"
                      animate="show"
                      className="rounded-[1.25rem] border border-white/10 bg-black/24 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/70">
                              {audienceLabel(sheet.audience)}
                            </span>
                          </div>
                          <h3 className="mt-3 text-sm font-semibold text-white">
                            {sheet.title ?? sheet.fileName}
                          </h3>
                          <p className="mt-1 text-xs text-white/55">{sheet.composer}</p>
                          <p className="mt-2 break-all text-xs text-white/45">
                            {sheet.fileName}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Link
                            href={`/scores/${sheet.slug}`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.09]"
                          >
                            Details
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                          <a
                            href={sheet.downloadUrl}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-amber-200 px-3 py-2 text-xs font-semibold text-black transition hover:bg-amber-100"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        </div>
                      </div>
                    </motion.article>
                  ))
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {otherTracks.length > 0 ? (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/62">
                More Releases
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Latest uploads
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/58">
              New music added from the admin dashboard appears first in this archive.
            </p>
          </div>

          <motion.div
            className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {otherTracks.map((track) => (
              <motion.article
                key={track.id}
                variants={item}
                className="rounded-[1.25rem] border border-white/10 bg-black/24 p-4"
              >
                <div className="relative h-44 overflow-hidden rounded-[1rem] bg-black">
                  <Image
                    src={mediaPoster}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/34" />
                  <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/48 px-3 py-1.5 text-xs font-semibold text-white/78 backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5 text-amber-100" />
                    {formatDate(track.createdAt)}
                  </div>
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">
                  {track.title ?? "Untitled Track"}
                </h3>
                <audio
                  className="mt-4 w-full"
                  controls
                  preload="metadata"
                  src={track.audioUrl}
                />
              </motion.article>
            ))}
          </motion.div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(251,191,36,0.14),rgba(6,182,212,0.08),rgba(255,255,255,0.04))] p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/24 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              <ShieldCheck className="h-4 w-4 text-amber-100" />
              Protected downloads
            </div>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white">
              Need the full Sir Jude Nnam score archive?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/64">
              Visit the Scores Bank for searchable public score pages. File downloads remain
              protected for registered users.
            </p>
          </div>
          <Button className="rounded-2xl bg-white px-6 py-6 text-black hover:bg-white/90" asChild>
            <Link href="/scores">
              Open Scores Bank
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
