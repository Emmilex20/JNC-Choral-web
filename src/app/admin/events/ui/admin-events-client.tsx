"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  startsAt: Date;
  endsAt: Date | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function AdminEventsClient({ initialEvents }: { initialEvents: EventRow[] }) {
  const [rows, setRows] = useState<EventRow[]>(initialEvents);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startsAt: "",
    endsAt: "",
  });

  const editing = useMemo(
    () => rows.find((r) => r.id === editingId) ?? null,
    [rows, editingId]
  );

  function resetForm() {
    setEditingId(null);
    setForm({ title: "", description: "", location: "", startsAt: "", endsAt: "" });
  }

  function beginEdit(r: EventRow) {
    setEditingId(r.id);
    setForm({
      title: r.title,
      description: r.description ?? "",
      location: r.location ?? "",
      startsAt: toLocalInputValue(new Date(r.startsAt)),
      endsAt: r.endsAt ? toLocalInputValue(new Date(r.endsAt)) : "",
    });
  }

  async function submit() {
    const payload = {
      title: form.title,
      description: form.description || undefined,
      location: form.location || undefined,
      startsAt: form.startsAt,
      endsAt: form.endsAt || undefined,
    };

    startTransition(async () => {
      if (editingId) {
        const res = await updateEventAction({ id: editingId, ...payload });
        if (!res.ok) return;

        setRows((prev) =>
          prev.map((r) =>
            r.id === editingId
              ? {
                  ...r,
                  title: payload.title,
                  description: payload.description ?? null,
                  location: payload.location ?? null,
                  startsAt: new Date(payload.startsAt),
                  endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
                }
              : r
          )
        );
        resetForm();
      } else {
        const res = await createEventAction(payload);
        if (!res.ok) return;
        // refresh strategy: simplest is reload
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
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Form */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">
          {editingId ? "Edit Event" : "Create Event"}
        </h2>
        <p className="mt-1 text-xs text-white/60">
          New events start unpublished. Publish when ready.
        </p>

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
              className="mt-1 min-h-27.5 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              placeholder="Short details about the event..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="w-full rounded-2xl sm:w-auto"
              disabled={isPending}
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
                disabled={isPending}
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

      {/* List */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">All Events</h2>
        <p className="mt-1 text-xs text-white/60">
          Public page shows only <b className="text-white">published</b> events.
        </p>

        <div className="mt-5 grid gap-3">
          {rows.length === 0 ? (
            <p className="text-sm text-white/60">No events yet.</p>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{r.title}</p>
                    <p className="mt-1 text-xs text-white/70">
                      {new Date(r.startsAt).toLocaleString()}
                      {r.location ? ` • ${r.location}` : ""}
                    </p>
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                      {r.isPublished ? "PUBLISHED" : "DRAFT"}
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
