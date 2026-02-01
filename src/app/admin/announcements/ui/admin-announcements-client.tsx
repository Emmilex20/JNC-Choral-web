"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  toggleAnnouncementPublishAction,
  updateAnnouncementAction,
} from "../actions";

type PostRow = {
  id: string;
  title: string;
  body: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default function AdminAnnouncementsClient({ initialPosts }: { initialPosts: PostRow[] }) {
  const [rows, setRows] = useState<PostRow[]>(initialPosts);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({ title: "", body: "" });

  const editing = useMemo(
    () => rows.find((r) => r.id === editingId) ?? null,
    [rows, editingId]
  );

  function resetForm() {
    setEditingId(null);
    setForm({ title: "", body: "" });
  }

  function beginEdit(r: PostRow) {
    setEditingId(r.id);
    setForm({ title: r.title, body: r.body });
  }

  function submit() {
    startTransition(async () => {
      if (editingId) {
        const res = await updateAnnouncementAction({ id: editingId, ...form });
        if (!res.ok) return;
        setRows((prev) =>
          prev.map((r) => (r.id === editingId ? { ...r, title: form.title, body: form.body } : r))
        );
        resetForm();
      } else {
        const res = await createAnnouncementAction(form);
        if (!res.ok) return;
        window.location.reload();
      }
    });
  }

  function togglePublish(id: string, next: boolean) {
    startTransition(async () => {
      const res = await toggleAnnouncementPublishAction({ id, isPublished: next });
      if (!res.ok) return;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isPublished: next } : r)));
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this announcement?")) return;
    startTransition(async () => {
      const res = await deleteAnnouncementAction({ id });
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
          {editingId ? "Edit Announcement" : "Create Announcement"}
        </h2>

        <div className="mt-6 grid gap-3">
          <div>
            <label className="text-xs text-white/70">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              placeholder="Audition update / rehearsal notice..."
            />
          </div>

          <div>
            <label className="text-xs text-white/70">Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              className="mt-1 min-h-40 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              placeholder="Write your announcement..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="w-full rounded-2xl sm:w-auto"
              disabled={isPending}
              onClick={submit}
              type="button"
            >
              {isPending ? "Saving..." : editingId ? "Save changes" : "Create"}
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
        <h2 className="text-xl font-semibold text-white">All Announcements</h2>
        <p className="mt-1 text-xs text-white/60">
          Public page shows only <b className="text-white">published</b> posts.
        </p>

        <div className="mt-5 grid gap-3">
          {rows.length === 0 ? (
            <p className="text-sm text-white/60">No announcements yet.</p>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{r.title}</p>
                    <p className="mt-1 text-xs text-white/60">
                      {new Date(r.createdAt).toLocaleDateString()}
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

                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-white/75">
                  {r.body}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
