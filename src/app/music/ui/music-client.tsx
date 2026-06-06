"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Download, FileText, Lock } from "lucide-react";

type Item = {
  id: string;
  title: string | null;
  audioUrl: string;
};

type Sheet = {
  id: string;
  title: string | null;
  fileName: string;
  audience: "ALL_USERS" | "CHORISTERS_ONLY";
  createdAt: string;
  downloadUrl: string;
};

const mediaPoster = "/hero/hero-1.png";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

function audienceLabel(audience: Sheet["audience"]) {
  return audience === "CHORISTERS_ONLY" ? "Choristers only" : "All signed-in users";
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
  return (
    <div className="mt-10 space-y-10">
      <motion.div
        className="grid gap-5 md:grid-cols-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {[
          {
            title: "Spirit-led worship",
            body: "Curated sets that build stamina, blend, and expression.",
          },
          {
            title: "Live sessions",
            body: "Experience the sound of JNC in rehearsals and on stage.",
          },
          {
            title: "Scores & scripts",
            body: "Sheet files can now be targeted to all signed-in users or verified choristers only.",
          },
        ].map((card) => (
          <motion.div
            key={card.title}
            variants={item}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <h3 className="text-lg font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-sm text-white/70">{card.body}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Latest releases
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Stream directly on the site or download for practice.
              </p>
            </div>
            <div className="text-xs text-white/60">
              New drops announced on the News page.
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {items.map((track) => (
              <motion.div
                key={track.id}
                variants={item}
                initial="hidden"
                animate="show"
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm font-semibold text-white">
                  {track.title ?? "Untitled Track"}
                </p>
                <div className="relative mt-3 h-40 overflow-hidden rounded-xl border border-white/10 bg-black/50">
                  <Image
                    src={mediaPoster}
                    alt="Track cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <audio className="mt-3 w-full" controls src={track.audioUrl} />
              </motion.div>
            ))}
            {items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
                No music uploaded yet. Check back soon.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-white">Choir Scripts & Sheets</h2>
              <p className="mt-2 text-sm text-white/70">
                Download charts, scripts, and arrangements based on your access level.
              </p>
            </div>
            <FileText className="h-5 w-5 text-white/55" />
          </div>

          {!isSignedIn ? (
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
              <div className="flex items-center gap-2 font-medium">
                <Lock className="h-4 w-4" />
                Sign in required
              </div>
              <p className="mt-2 text-amber-100/85">
                Sheet files are available to signed-in users. Verified choristers also get access
                to chorister-only downloads.
              </p>
              <Link
                href="/auth/login?callbackUrl=/music"
                className="mt-4 inline-flex items-center rounded-full border border-amber-400/20 bg-black/30 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-black/40"
              >
                Sign in to continue
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/70">
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
                  {sheets.length} file{sheets.length === 1 ? "" : "s"} available
                </span>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
                  {canAccessChoristerSheets ? "Includes chorister-only files" : "All-user files only"}
                </span>
              </div>

              <div className="mt-6 grid gap-3">
                {sheets.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/60">
                    No sheet files available for your account yet.
                  </div>
                ) : (
                  sheets.map((sheet) => (
                    <motion.div
                      key={sheet.id}
                      variants={item}
                      initial="hidden"
                      animate="show"
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/70">
                              {audienceLabel(sheet.audience)}
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-white">
                            {sheet.title ?? sheet.fileName}
                          </p>
                          <p className="mt-1 break-all text-xs text-white/55">{sheet.fileName}</p>
                          <p className="mt-2 text-xs text-white/55">
                            Uploaded {new Date(sheet.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={sheet.downloadUrl}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
