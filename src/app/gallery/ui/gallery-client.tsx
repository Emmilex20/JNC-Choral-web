"use client";

import { useState } from "react";

type Item = {
  id: string;
  title: string | null;
  imageUrl: string;
};

export default function GalleryClient({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<Item | null>(null);

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {items.map((x) => (
          <button
            key={x.id}
            onClick={() => setOpen(x)}
            className="mb-4 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left hover:bg-white/10 transition"
          >
            <img src={x.imageUrl} alt={x.title ?? "Gallery"} className="w-full object-cover" />
            {x.title ? (
              <div className="p-3 text-sm font-semibold text-white">{x.title}</div>
            ) : null}
          </button>
        ))}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={open.imageUrl} alt={open.title ?? "Image"} className="w-full object-contain" />
            <div className="flex items-center justify-between p-4">
              <p className="text-sm font-semibold text-white">{open.title ?? "Gallery"}</p>
              <button
                onClick={() => setOpen(null)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
