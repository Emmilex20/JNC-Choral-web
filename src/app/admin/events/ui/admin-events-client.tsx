"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/errors";
import {
  createEventAction,
  deleteEventAction,
  toggleEventPublishAction,
  updateEventAction,
} from "../actions";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  videoUrl: string | null;
  videoPublicId: string | null;
  startsAt: Date;
  endsAt: Date | null;
  isPublished: boolean;
  responses: {
    id: string;
    status: "ATTENDING" | "MAYBE" | "NOT_ATTENDING";
    fullName: string;
    email: string;
    phone: string;
    note: string | null;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

async function getSignature() {
  const res = await fetch("/api/admin/cloudinary-signature?folderSuffix=event-media");
  if (!res.ok) throw new Error("Failed to get upload signature");
  return res.json();
}

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function summarizeResponses(
  responses: { status: "ATTENDING" | "MAYBE" | "NOT_ATTENDING" }[]
) {
  const summary = {
    attending: 0,
    maybe: 0,
    notAttending: 0,
  };

  responses.forEach((response) => {
    if (response.status === "ATTENDING") summary.attending += 1;
    if (response.status === "MAYBE") summary.maybe += 1;
    if (response.status === "NOT_ATTENDING") summary.notAttending += 1;
  });

  return summary;
}

export default function AdminEventsClient({ initialEvents }: { initialEvents: EventRow[] }) {
  const [rows, setRows] = useState<EventRow[]>(initialEvents);
  const [isPending, startTransition] = useTransition();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    imageUrl: "",
    imagePublicId: "",
    videoUrl: "",
    videoPublicId: "",
    startsAt: "",
    endsAt: "",
  });

  const editing = useMemo(
    () => rows.find((r) => r.id === editingId) ?? null,
    [rows, editingId]
  );

  function resetForm() {
    setEditingId(null);
    setError(null);
    setForm({
      title: "",
      description: "",
      location: "",
      imageUrl: "",
      imagePublicId: "",
      videoUrl: "",
      videoPublicId: "",
      startsAt: "",
      endsAt: "",
    });
  }

  function beginEdit(r: EventRow) {
    setEditingId(r.id);
    setError(null);
    setForm({
      title: r.title,
      description: r.description ?? "",
      location: r.location ?? "",
      imageUrl: r.imageUrl ?? "",
      imagePublicId: r.imagePublicId ?? "",
      videoUrl: r.videoUrl ?? "",
      videoPublicId: r.videoPublicId ?? "",
      startsAt: toLocalInputValue(new Date(r.startsAt)),
      endsAt: r.endsAt ? toLocalInputValue(new Date(r.endsAt)) : "",
    });
  }

  async function uploadImage(file: File) {
    const sig = await getSignature();
    const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;

    const data = new FormData();
    data.append("file", file);
    data.append("api_key", sig.apiKey);
    data.append("timestamp", String(sig.timestamp));
    data.append("signature", sig.signature);
    data.append("folder", sig.folder);

    const res = await fetch(url, { method: "POST", body: data });
    if (!res.ok) throw new Error("Image upload failed");
    return res.json();
  }

  async function uploadVideo(file: File) {
    const sig = await getSignature();
    const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`;

    const data = new FormData();
    data.append("file", file);
    data.append("api_key", sig.apiKey);
    data.append("timestamp", String(sig.timestamp));
    data.append("signature", sig.signature);
    data.append("folder", sig.folder);
    data.append("resource_type", "video");

    const res = await fetch(url, { method: "POST", body: data });
    if (!res.ok) throw new Error("Video upload failed");
    return res.json();
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
    try {
      const uploaded = await uploadImage(file);
      setForm((current) => ({
        ...current,
        imageUrl: uploaded.secure_url as string,
        imagePublicId: uploaded.public_id as string,
      }));
    } catch (err) {
      setError(getErrorMessage(err, "Image upload failed"));
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  async function onPickVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setError(null);
    try {
      const uploaded = await uploadVideo(file);
      setForm((current) => ({
        ...current,
        videoUrl: uploaded.secure_url as string,
        videoPublicId: uploaded.public_id as string,
      }));
    } catch (err) {
      setError(getErrorMessage(err, "Video upload failed"));
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  }

  async function submit() {
    const payload = {
      title: form.title,
      description: form.description || undefined,
      location: form.location || undefined,
      imageUrl: form.imageUrl || undefined,
      imagePublicId: form.imagePublicId || undefined,
      videoUrl: form.videoUrl || undefined,
      videoPublicId: form.videoPublicId || undefined,
      startsAt: form.startsAt,
      endsAt: form.endsAt || undefined,
    };

    setError(null);
    startTransition(async () => {
      if (editingId) {
        const res = await updateEventAction({ id: editingId, ...payload });
        if (!res.ok) {
          setError(res.error);
          return;
        }

        setRows((prev) =>
          prev.map((r) =>
            r.id === editingId
              ? {
                  ...r,
                  title: payload.title,
                  description: payload.description ?? null,
                  location: payload.location ?? null,
                  imageUrl: payload.imageUrl ?? null,
                  imagePublicId: payload.imagePublicId ?? null,
                  videoUrl: payload.videoUrl ?? null,
                  videoPublicId: payload.videoPublicId ?? null,
                  startsAt: new Date(payload.startsAt),
                  endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
                  responses: r.responses,
                }
              : r
          )
        );
        resetForm();
      } else {
        const res = await createEventAction(payload);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        window.location.reload();
      }
    });
  }

  function togglePublish(id: string, next: boolean) {
    startTransition(async () => {
      const res = await toggleEventPublishAction({ id, isPublished: next });
      if (!res.ok) return;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isPublished: next } : r)));
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this event?")) return;
    startTransition(async () => {
      const res = await deleteEventAction({ id });
      if (!res.ok) return;
      setRows((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) resetForm();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <div className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Programming Desk</p>
        <h2 className="text-xl font-semibold text-white">
          {editingId ? "Edit Event" : "Create Event"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/60">
          New events start unpublished. Publish when ready.
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3">
          <div>
            <label className="text-xs text-white/70">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              placeholder="Choir rehearsal / Performance / Auditions..."
            />
          </div>

          <div>
            <label className="text-xs text-white/70">Location (optional)</label>
            <input
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              placeholder="Durumi, Abuja"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs text-white/70">Starts At</label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              />
            </div>
            <div>
              <label className="text-xs text-white/70">Ends At (optional)</label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/70">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="mt-1 min-h-28 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              placeholder="Short details about the event..."
            />
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                  Event Media
                </p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Add an optional image, video, or both for the public event page.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPickImage}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <span className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">
                    {uploadingImage ? "Uploading image..." : "Upload Image"}
                  </span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={onPickVideo}
                    className="hidden"
                    disabled={uploadingVideo}
                  />
                  <span className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">
                    {uploadingVideo ? "Uploading video..." : "Upload Video"}
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <ImageIcon className="h-4 w-4" />
                    Event image
                  </div>
                  {form.imageUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          imageUrl: "",
                          imagePublicId: "",
                        }))
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                {form.imageUrl ? (
                  <div className="relative mt-4 h-40 w-full overflow-hidden rounded-2xl">
                    <Image
                      src={form.imageUrl}
                      alt="Event preview"
                      fill
                      sizes="(max-width: 1024px) 100vw, 420px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-white/55">No image uploaded yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Video className="h-4 w-4" />
                    Event video
                  </div>
                  {form.videoUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          videoUrl: "",
                          videoPublicId: "",
                        }))
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                {form.videoUrl ? (
                  <video src={form.videoUrl} controls className="mt-4 w-full rounded-2xl" />
                ) : (
                  <p className="mt-3 text-sm text-white/55">No video uploaded yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="w-full rounded-2xl sm:w-auto"
              disabled={isPending || uploadingImage || uploadingVideo}
              onClick={submit}
              type="button"
            >
              {isPending ? "Saving..." : editingId ? "Save changes" : "Create event"}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
                onClick={resetForm}
                disabled={isPending || uploadingImage || uploadingVideo}
              >
                Cancel
              </Button>
            ) : null}
          </div>

          {editing ? (
            <div className="mt-2 text-xs text-white/60">
              Editing: <span className="text-white">{editing.title}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Schedule Queue</p>
        <h2 className="text-xl font-semibold text-white">All Events</h2>
        <p className="mt-1 text-xs text-white/60">
          Public page shows only <b className="text-white">published</b> events.
        </p>

        <div className="mt-5 grid gap-3">
          {rows.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/60">
              No events yet.
            </p>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className="rounded-[1.75rem] border border-white/10 bg-black/30 p-5"
              >
                {(() => {
                  const summary = summarizeResponses(r.responses);
                  return (
                    <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{r.title}</p>
                    <p className="mt-1 text-xs text-white/70">
                      {new Date(r.startsAt).toLocaleString()}
                      {r.location ? ` - ${r.location}` : ""}
                    </p>
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                      {r.isPublished ? "PUBLISHED" : "DRAFT"}
                    </Badge>
                    {r.imageUrl ? (
                      <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                        Image
                      </Badge>
                    ) : null}
                    {r.videoUrl ? (
                      <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                        Video
                      </Badge>
                    ) : null}
                    <Badge className="rounded-full bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20">
                      {summary.attending} attending
                    </Badge>
                    <Badge className="rounded-full bg-amber-500/15 text-amber-100 hover:bg-amber-500/20">
                      {summary.maybe} maybe
                    </Badge>
                    <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                      {summary.notAttending} can&apos;t go
                    </Badge>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
                      onClick={() => togglePublish(r.id, !r.isPublished)}
                      disabled={isPending}
                    >
                      {r.isPublished ? "Unpublish" : "Publish"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
                      onClick={() => beginEdit(r)}
                      disabled={isPending}
                    >
                      Edit
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
                      onClick={() => remove(r.id)}
                      disabled={isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {r.description ? (
                  <p className="mt-3 text-sm text-white/75">{r.description}</p>
                ) : null}
                {r.imageUrl ? (
                  <div className="relative mt-4 h-44 w-full overflow-hidden rounded-2xl">
                    <Image
                      src={r.imageUrl}
                      alt={r.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                {r.videoUrl ? (
                  <video src={r.videoUrl} controls className="mt-4 w-full rounded-2xl" />
                ) : null}

                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                        Event RSVPs
                      </p>
                      <p className="mt-2 text-sm text-white/60">
                        Submissions from the public event page for this event.
                      </p>
                    </div>
                    <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                      {r.responses.length} total
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {r.responses.length === 0 ? (
                      <p className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/60">
                        No RSVP submissions yet.
                      </p>
                    ) : (
                      r.responses.map((response) => (
                        <div
                          key={response.id}
                          className="rounded-2xl border border-white/10 bg-black/25 p-4"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <p className="font-semibold text-white">{response.fullName}</p>
                              <p className="mt-1 break-all text-xs text-white/65">
                                {response.email}
                              </p>
                              <p className="mt-1 text-xs text-white/65">{response.phone}</p>
                              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/40">
                                Submitted {new Date(response.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                                {response.status === "ATTENDING"
                                  ? "Attending"
                                  : response.status === "MAYBE"
                                    ? "Maybe"
                                    : "Can't make it"}
                              </Badge>
                            </div>
                          </div>
                          {response.note ? (
                            <p className="mt-4 text-sm leading-6 text-white/72">
                              {response.note}
                            </p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                    </>
                  );
                })()}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
