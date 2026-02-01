"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createGalleryItemAction, deleteGalleryItemAction } from "../actions";

type Item = {
  id: string;
  title: string | null;
  imageUrl: string;
  publicId: string;
  createdAt: Date;
};

async function getSignature() {
  const res = await fetch("/api/admin/cloudinary-signature");
  if (!res.ok) throw new Error("Failed to get signature");
  return res.json();
}

export default function AdminGalleryClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);

    const sig = await getSignature();
    const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);

    const up = await fetch(url, { method: "POST", body: form });
    if (!up.ok) throw new Error("Upload failed");
    return up.json();
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const uploaded = await upload(file);
        const imageUrl = uploaded.secure_url as string;
        const publicId = uploaded.public_id as string;

        const res = await createGalleryItemAction({
          imageUrl,
          publicId,
          title: title.trim() || undefined,
        });

        if (!res.ok) {
          setError(res.error);
          return;
        }

        // simplest refresh so types/dates match server
        window.location.reload();
      } catch (err: any) {
        setError(err?.message ?? "Upload error");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Remove from gallery?")) return;
    startTransition(async () => {
      const res = await deleteGalleryItemAction({ id });
      if (!res.ok) return;
      setItems((prev) => prev.filter((x) => x.id !== id));
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      {error ? (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title (e.g. Easter Concert 2025)"
            className="w-full md:w-96 rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
          />

          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={onPickFile}
              className="hidden"
              disabled={isPending}
            />
            <span className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10">
              {isPending ? "Uploading..." : "Upload Image"}
            </span>
          </label>
        </div>

        <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
          Total: {items.length}
        </Badge>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((x) => (
          <div key={x.id} className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <img
              src={x.imageUrl}
              alt={x.title ?? "Gallery image"}
              className="h-48 w-full rounded-xl object-cover"
            />
            <div className="mt-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white line-clamp-1">
                  {x.title ?? "Untitled"}
                </p>
                <p className="text-xs text-white/60 line-clamp-1">{x.publicId}</p>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
                onClick={() => remove(x.id)}
                disabled={isPending}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
