"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import {
  createMusicItemAction,
  createMusicSheetAction,
  deleteMusicItemAction,
  deleteMusicSheetAction,
  updateMusicSheetAction,
  updateMusicTitleAction,
} from "../actions";

type Item = {
  id: string;
  title: string | null;
  audioUrl: string;
  publicId: string;
  createdAt: Date;
};

type Sheet = {
  id: string;
  title: string | null;
  fileName: string;
  mimeType: string | null;
  publicId: string;
  audience: "ALL_USERS" | "CHORISTERS_ONLY";
  createdAt: string;
};

async function getSignature(folderSuffix?: string) {
  const query = folderSuffix
    ? `?folderSuffix=${encodeURIComponent(folderSuffix)}`
    : "";
  const res = await fetch(`/api/admin/cloudinary-signature${query}`);
  if (!res.ok) throw new Error("Failed to get signature");
  return res.json();
}

function audienceLabel(audience: Sheet["audience"]) {
  return audience === "CHORISTERS_ONLY" ? "Choristers only" : "All users";
}

export default function AdminMusicClient({
  initialItems,
  initialSheets,
}: {
  initialItems: Item[];
  initialSheets: Sheet[];
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [sheets, setSheets] = useState<Sheet[]>(initialSheets);
  const [title, setTitle] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [sheetTitle, setSheetTitle] = useState("");
  const [sheetAudience, setSheetAudience] =
    useState<Sheet["audience"]>("ALL_USERS");
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingSheetTitle, setEditingSheetTitle] = useState("");
  const [editingSheetAudience, setEditingSheetAudience] =
    useState<Sheet["audience"]>("ALL_USERS");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function uploadAudio(file: File) {
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

  async function uploadSheet(file: File) {
    setError(null);

    const sig = await getSignature("music-sheets");
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
    return up.json();
  }

  function onPickAudioFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const uploaded = await uploadAudio(file);
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
      } catch (err) {
        setError(getErrorMessage(err, "Upload error"));
      } finally {
        e.target.value = "";
      }
    });
  }

  function onPickSheetFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const uploaded = await uploadSheet(file);
        const fileUrl = uploaded.secure_url as string;
        const publicId = uploaded.public_id as string;

        const res = await createMusicSheetAction({
          fileUrl,
          publicId,
          fileName: file.name,
          mimeType: file.type || undefined,
          title: sheetTitle.trim() || undefined,
          audience: sheetAudience,
        });

        if (!res.ok) {
          setError(res.error);
          return;
        }

        setSheets((prev) => [
          {
            id: res.sheet.id,
            title: res.sheet.title,
            fileName: res.sheet.fileName,
            mimeType: res.sheet.mimeType,
            publicId: res.sheet.publicId,
            audience: res.sheet.audience,
            createdAt: res.sheet.createdAt.toISOString(),
          },
          ...prev,
        ]);
        setSheetTitle("");
        setSheetAudience("ALL_USERS");
      } catch (err) {
        setError(getErrorMessage(err, "Upload error"));
      } finally {
        e.target.value = "";
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

  function beginSheetEdit(sheet: Sheet) {
    setEditingSheetId(sheet.id);
    setEditingSheetTitle(sheet.title ?? "");
    setEditingSheetAudience(sheet.audience);
  }

  function cancelSheetEdit() {
    setEditingSheetId(null);
    setEditingSheetTitle("");
    setEditingSheetAudience("ALL_USERS");
  }

  function saveSheetEdit(id: string) {
    startTransition(async () => {
      const res = await updateMusicSheetAction({
        id,
        title: editingSheetTitle.trim() || undefined,
        audience: editingSheetAudience,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSheets((prev) =>
        prev.map((sheet) =>
          sheet.id === id
            ? {
                ...sheet,
                title: editingSheetTitle.trim() || null,
                audience: editingSheetAudience,
              }
            : sheet
        )
      );
      cancelSheetEdit();
    });
  }

  function removeSheet(id: string) {
    if (!confirm("Remove this sheet file?")) return;
    startTransition(async () => {
      const res = await deleteMusicSheetAction({ id });
      if (!res.ok) return;
      setSheets((prev) => prev.filter((sheet) => sheet.id !== id));
      if (editingSheetId === id) cancelSheetEdit();
    });
  }

  return (
    <div className="grid gap-6">
      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Audio tracks</h2>
              <p className="mt-1 text-sm text-white/60">
                Public tracks for the main music library.
              </p>
            </div>
            <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
              {items.length} track{items.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="mt-5 flex flex-col gap-2 md:flex-row md:items-center">
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
                onChange={onPickAudioFile}
                className="hidden"
                disabled={isPending}
              />
              <span className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10">
                {isPending ? "Uploading..." : "Upload Audio"}
              </span>
            </label>
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
                      <Button className="rounded-2xl" onClick={() => saveEdit(x.id)} disabled={isPending}>
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
            {items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/60">
                No audio tracks uploaded yet.
              </div>
            ) : null}
          </div>
        </div>

        <div className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Choir scripts & sheets</h2>
              <p className="mt-1 text-sm text-white/60">
                Upload PDF or Word files and target downloads to all signed-in users or choristers only.
              </p>
            </div>
            <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
              {sheets.length} sheet file{sheets.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
            <input
              value={sheetTitle}
              onChange={(e) => setSheetTitle(e.target.value)}
              placeholder="Optional title (e.g. Easter Cantata Alto Score)"
              className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
            />
            <select
              value={sheetAudience}
              onChange={(e) => setSheetAudience(e.target.value as Sheet["audience"])}
              className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
            >
              <option value="ALL_USERS">All users</option>
              <option value="CHORISTERS_ONLY">Choristers only</option>
            </select>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={onPickSheetFile}
                className="hidden"
                disabled={isPending}
              />
              <span className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10">
                {isPending ? "Uploading..." : "Upload Sheet"}
              </span>
            </label>
          </div>

          <div className="mt-6 grid gap-3">
            {sheets.map((sheet) => (
              <div key={sheet.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                {editingSheetId === sheet.id ? (
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                    <input
                      value={editingSheetTitle}
                      onChange={(e) => setEditingSheetTitle(e.target.value)}
                      placeholder="Sheet title"
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
                    />
                    <select
                      value={editingSheetAudience}
                      onChange={(e) =>
                        setEditingSheetAudience(e.target.value as Sheet["audience"])
                      }
                      className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
                    >
                      <option value="ALL_USERS">All users</option>
                      <option value="CHORISTERS_ONLY">Choristers only</option>
                    </select>
                    <div className="flex flex-wrap gap-2">
                      <Button className="rounded-2xl" onClick={() => saveSheetEdit(sheet.id)} disabled={isPending}>
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                        onClick={cancelSheetEdit}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                          {audienceLabel(sheet.audience)}
                        </Badge>
                        {sheet.mimeType ? (
                          <Badge className="rounded-full bg-white/10 text-white/80 hover:bg-white/10">
                            {sheet.mimeType.includes("pdf") ? "PDF" : "Word"}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-white">
                        {sheet.title ?? sheet.fileName}
                      </p>
                      <p className="mt-1 break-all text-xs text-white/60">{sheet.fileName}</p>
                      <p className="mt-2 text-xs text-white/50">
                        {new Date(sheet.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => beginSheetEdit(sheet)}
                        disabled={isPending}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                        onClick={() => removeSheet(sheet.id)}
                        disabled={isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {sheets.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/60">
                No choir sheet files uploaded yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
