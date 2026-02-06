"use client";

import { motion } from "framer-motion";

type Item = {
  id: string;
  title: string | null;
  audioUrl: string;
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

export default function MusicClient({ items }: { items: Item[] }) {
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
            title: "Originals & arrangements",
            body: "Fresh arrangements that carry our signature style.",
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
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/50">
                <img
                  src={mediaPoster}
                  alt="Track cover"
                  className="h-40 w-full object-cover"
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
    </div>
  );
}
