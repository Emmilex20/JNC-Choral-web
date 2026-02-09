"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createChoristerNoticeAction,
  deleteChoristerNoticeAction,
  toggleChoristerNoticeAction,
} from "../actions";

type Notice = {
  id: string;
  title: string;
  body: string;
  attachmentUrl: string | null;
  isPublished: boolean;
  createdAt: string;
};

export default function AdminChoristerNoticesClient({
  initialNotices,
}: {
  initialNotices: Notice[];
}) {
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function getSignature() {
    const res = await fetch("/api/admin/cloudinary-signature");
    if (!res.ok) throw new Error("Failed to get signature");
    return res.json();
  }

  async function uploadAttachment(file: File) {
    setError(null);
    setUploading(true);
    try {
      const sig = await getSignature();
      const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/raw/upload`;

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      form.append("resource_type", "raw");

      const up = await fetch(url, { method: "POST", body: form });
      if (!up.ok) throw new Error("Upload failed");
      const uploaded = await up.json();
      setAttachmentUrl(uploaded.secure_url as string);
    } catch (err: any) {
      setError(err?.message ?? "Upload error");
    } finally {
      setUploading(false);
    }
  }

  function createNotice() {
    setError(null);
    startTransition(async () => {
      const res = await createChoristerNoticeAction({
        title,
        body,
        attachmentUrl: attachmentUrl.trim() || undefined,
        isPublished,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNotices((prev) => [
        {
          id: res.notice.id,
          title: res.notice.title,
          body: res.notice.body,
          attachmentUrl: res.notice.attachmentUrl,
          isPublished: res.notice.isPublished,
          createdAt: res.notice.createdAt.toISOString(),
        },
        ...prev,
      ]);
      setTitle("");
      setBody("");
      setAttachmentUrl("");
      setIsPublished(true);
    });
  }

  function togglePublish(id: string, next: boolean) {
    startTransition(async () => {
      const res = await toggleChoristerNoticeAction({ id, isPublished: next });
      if (!res.ok) return;
      setNotices((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isPublished: next } : n))
      );
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this notice?")) return;
    startTransition(async () => {
      const res = await deleteChoristerNoticeAction({ id });
      if (!res.ok) return;
      setNotices((prev) => prev.filter((n) => n.id !== id));
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
      {error ? (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notice title"
          className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
        />
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Notice message"
          className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
        />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <input
          value={attachmentUrl}
          onChange={(e) => setAttachmentUrl(e.target.value)}
          placeholder="Attachment URL (optional) or upload below"
          className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
        />
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="file"
            accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,audio/mpeg,video/mp4"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadAttachment(file);
            }}
            className="hidden"
            disabled={uploading || isPending}
          />
          <span className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">
            {uploading ? "Uploading..." : "Upload Attachment"}
          </span>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 accent-white"
          />
          Publish now
        </label>
        <Button className="rounded-2xl" onClick={createNotice} disabled={isPending}>
          {isPending ? "Saving..." : "Create Notice"}
        </Button>
      </div>

      <div className="mt-6 grid gap-3">
        {notices.length === 0 ? (
          <p className="text-sm text-white/60">No notices yet.</p>
        ) : (
          notices.map((n) => (
            <div
              key={n.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-white/60">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-white/70">{n.body}</p>
                  {n.attachmentUrl ? (
                    <a
                      href={n.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                    >
                      View attachment
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                    {n.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => togglePublish(n.id, !n.isPublished)}
                    disabled={isPending}
                  >
                    {n.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                    onClick={() => remove(n.id)}
                    disabled={isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
