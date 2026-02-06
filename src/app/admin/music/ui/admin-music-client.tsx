"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createMusicItemAction,
  deleteMusicItemAction,
  updateMusicTitleAction,
} from "../actions";

type Item = {
  id: string;
  title: string | null;
  audioUrl: string;
  publicId: string;
  createdAt: Date;
};

async function getSignature() {
  const res = await fetch("/api/admin/cloudinary-signature");
  if (!res.ok) throw new Error("Failed to get signature");
  return res.json();
}

export default function AdminMusicClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [title, setTitle] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);

    const sig = await getSignature();
    const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`;

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);
    form.append("resource_type", "video");

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
        const audioUrl = uploaded.secure_url as string;
        const publicId = uploaded.public_id as string;

        const res = await createMusicItemAction({
          audioUrl,
          publicId,
          title: title.trim() || undefined,
        });

        if (!res.ok) {
          setError(res.error);
          return;
        }

        window.location.reload();
      } catch (err: any) {
        setError(err?.message ?? "Upload error");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Remove from music?")) return;
    startTransition(async () => {
      const res = await deleteMusicItemAction({ id });
      if (!res.ok) return;
      setItems((prev) => prev.filter((x) => x.id !== id));
    });
  }

  function startEdit(item: Item) {
    setEditId(item.id);
    setEditTitle(item.title ?? "");
  }

  function cancelEdit() {
    setEditId(null);
    setEditTitle("");
  }

  function saveEdit(id: string) {
    startTransition(async () => {
      const res = await updateMusicTitleAction({
        id,
        title: editTitle.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, title: editTitle.trim() || null } : x))
      );
      cancelEdit();
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
            placeholder="Optional title (e.g. Worship Medley)"
            className="w-full md:w-96 rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
          />

          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="file"
              accept="audio/*"
              onChange={onPickFile}
              className="hidden"
              disabled={isPending}
            />
            <span className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10">
              {isPending ? "Uploading..." : "Upload Audio"}
            </span>
          </label>
        </div>

        <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
          Total: {items.length}
        </Badge>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {items.map((x) => (
          <div key={x.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            {editId === x.id ? (
              <div className="flex flex-col gap-2">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Track title"
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-sm text-white outline-none focus:border-white/25"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="rounded-2xl"
                    onClick={() => saveEdit(x.id)}
                    disabled={isPending}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    onClick={cancelEdit}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white line-clamp-1">
                  {x.title ?? "Untitled Track"}
                </p>
                <Button
                  variant="outline"
                  className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => startEdit(x)}
                  disabled={isPending}
                >
                  Edit
                </Button>
              </div>
            )}
            <audio className="mt-3 w-full" controls src={x.audioUrl} />
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-white/60 line-clamp-1">{x.publicId}</p>
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
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
