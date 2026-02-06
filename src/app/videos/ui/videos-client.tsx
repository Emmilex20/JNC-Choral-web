"use client";

import { motion } from "framer-motion";

type Item = {
  id: string;
  title: string | null;
  videoUrl: string;
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function VideosClient({ items }: { items: Item[] }) {
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
            title: "Performance reels",
            body: "Stage moments, worship nights, and concert highlights.",
          },
          {
            title: "Behind the scenes",
            body: "Snapshots from rehearsals, training, and team culture.",
          },
          {
            title: "Spotlight stories",
            body: "Meet the voices and creatives behind the platform.",
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
              Latest videos
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Watch full performances and curated clips.
            </p>
          </div>
          <div className="text-xs text-white/60">
            New releases are announced on the News page.
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((vid) => (
            <motion.div
              key={vid.id}
              variants={item}
              initial="hidden"
              animate="show"
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <p className="text-sm font-semibold text-white">
                {vid.title ?? "Untitled Video"}
              </p>
              <video
                className="mt-3 w-full rounded-xl"
                controls
                src={vid.videoUrl}
              />
            </motion.div>
          ))}
          {items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              No videos yet. Check back soon.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
