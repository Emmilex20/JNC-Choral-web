"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string | null;
  imageUrl: string;
  createdAt: string;
};

const layouts = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-2 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-2 md:row-span-1",
  "md:col-span-1 md:row-span-1",
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const tile = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function GalleryClient({ items }: { items: Item[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex === null ? null : items[openIndex];

  function openImage(index: number) {
    setOpenIndex(index);
  }

  function showPrevious() {
    setOpenIndex((current) => {
      if (current === null) return current;
      return current === 0 ? items.length - 1 : current - 1;
    });
  }

  function showNext() {
    setOpenIndex((current) => {
      if (current === null) return current;
      return current === items.length - 1 ? 0 : current + 1;
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
          <Camera className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-2xl font-semibold text-white">
          No gallery uploads yet.
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/62">
          Photos and posters added by the admin team will appear here as a public visual archive.
        </p>
        <Button className="mt-6 rounded-2xl bg-amber-200 text-black hover:bg-amber-100" asChild>
          <Link href="/contact">
            Contact media desk
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid auto-rows-[230px] gap-4 md:grid-cols-4"
      >
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            type="button"
            variants={tile}
            onClick={() => openImage(index)}
            className={cn(
              "group relative h-72 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.045] text-left shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition duration-200 hover:-translate-y-0.5 hover:border-amber-200/30 md:h-auto",
              layouts[index % layouts.length],
            )}
          >
            <Image
              src={item.imageUrl}
              alt={item.title ?? "JNC gallery moment"}
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.78))]" />
            <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-black/42 text-white/78 opacity-0 backdrop-blur transition group-hover:opacity-100">
              <Maximize2 className="h-4 w-4" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/76">
                {formatDate(item.createdAt)}
              </p>
              <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-white">
                {item.title ?? "JNC gallery moment"}
              </h3>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {open && openIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.title ?? "Gallery image"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm"
          onClick={() => setOpenIndex(null)}
        >
          <div
            className="w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#05070d] shadow-[0_32px_90px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-[72vh] min-h-[360px] bg-black">
              <Image
                src={open.imageUrl}
                alt={open.title ?? "JNC gallery image"}
                fill
                sizes="100vw"
                className="object-contain"
              />
              {items.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={showPrevious}
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-black/50 text-white backdrop-blur transition hover:bg-white/12"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={showNext}
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-black/50 text-white backdrop-blur transition hover:bg-white/12"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/68">
                  {formatDate(open.createdAt)}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {open.title ?? "JNC gallery moment"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
