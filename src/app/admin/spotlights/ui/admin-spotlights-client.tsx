"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  Edit3,
  ImagePlus,
  Loader2,
  Music2,
  Quote,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import {
  createSpotlightAction,
  deleteSpotlightAction,
  updateSpotlightAction,
} from "../actions";

type FeaturedUserOption = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type SpotlightRow = {
  id: string;
  featuredUserId: string | null;
  name: string;
  photoUrl: string | null;
  photoPublicId: string | null;
  story: string;
  musicalJourney: string;
  favoriteSong: string | null;
  advice: string | null;
  weekStart: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  featuredUser: {
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
};

type SpotlightForm = {
  featuredUserId: string;
  name: string;
  photoUrl: string;
  photoPublicId: string;
  story: string;
  musicalJourney: string;
  favoriteSong: string;
  advice: string;
  weekStart: string;
  isPublished: boolean;
};

type SignatureResponse = {
  timestamp: number;
  signature: string;
  folder: string;
  cloudName: string;
  apiKey: string;
};

type CloudinaryImageUpload = {
  secure_url: string;
  public_id: string;
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25";
const labelClass = "text-xs font-medium text-white/70";

function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay() || 7;
  now.setDate(now.getDate() - day + 1);
  return now.toISOString().slice(0, 10);
}

function emptyForm(): SpotlightForm {
  return {
    featuredUserId: "",
    name: "",
    photoUrl: "",
    photoPublicId: "",
    story: "",
    musicalJourney: "",
    favoriteSong: "",
    advice: "",
    weekStart: getCurrentWeekStart(),
    isPublished: false,
  };
}

function displayUser(user: FeaturedUserOption) {
  return user.name || user.email || "JNC member";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

async function getSignature() {
  const res = await fetch("/api/admin/cloudinary-signature?folderSuffix=spotlights");
  if (!res.ok) throw new Error("Failed to get upload signature");
  return (await res.json()) as SignatureResponse;
}

async function uploadSpotlightPhoto(file: File) {
  const sig = await getSignature();
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  if (!up.ok) throw new Error("Spotlight photo upload failed");
  return (await up.json()) as CloudinaryImageUpload;
}

export default function AdminSpotlightsClient({
  initialSpotlights,
  featuredUsers,
}: {
  initialSpotlights: SpotlightRow[];
  featuredUsers: FeaturedUserOption[];
}) {
  const [spotlights] = useState(initialSpotlights);
  const [form, setForm] = useState<SpotlightForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedUser = useMemo(
    () => featuredUsers.find((user) => user.id === form.featuredUserId) ?? null,
    [featuredUsers, form.featuredUserId]
  );
  const previewPhoto = form.photoUrl || selectedUser?.image || "/logo.svg";

  function reloadOnSuccess(result: { ok: boolean; error?: string }) {
    if (!result.ok) {
      setError(result.error ?? "Unable to save spotlight");
      return;
    }
    window.location.reload();
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
  }

  function beginEdit(spotlight: SpotlightRow) {
    setEditingId(spotlight.id);
    setError(null);
    setForm({
      featuredUserId: spotlight.featuredUserId ?? "",
      name: spotlight.name,
      photoUrl: spotlight.photoUrl ?? "",
      photoPublicId: spotlight.photoPublicId ?? "",
      story: spotlight.story,
      musicalJourney: spotlight.musicalJourney,
      favoriteSong: spotlight.favoriteSong ?? "",
      advice: spotlight.advice ?? "",
      weekStart: spotlight.weekStart,
      isPublished: spotlight.isPublished,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectFeaturedUser(userId: string) {
    const user = featuredUsers.find((item) => item.id === userId) ?? null;
    setForm((current) => ({
      ...current,
      featuredUserId: userId,
      name: current.name || user?.name || user?.email?.split("@")[0] || "",
      photoUrl: current.photoUrl || user?.image || "",
    }));
  }

  function submitSpotlight() {
    setError(null);
    startTransition(async () => {
      const payload = {
        featuredUserId: form.featuredUserId || undefined,
        name: form.name,
        photoUrl: form.photoUrl || undefined,
        photoPublicId: form.photoPublicId || undefined,
        story: form.story,
        musicalJourney: form.musicalJourney,
        favoriteSong: form.favoriteSong,
        advice: form.advice,
        weekStart: form.weekStart,
        isPublished: form.isPublished,
      };

      const res = editingId
        ? await updateSpotlightAction({ id: editingId, ...payload })
        : await createSpotlightAction(payload);
      reloadOnSuccess(res);
    });
  }

  function removeSpotlight(spotlight: SpotlightRow) {
    if (!confirm(`Delete spotlight for ${spotlight.name}?`)) return;
    startTransition(async () => {
      const res = await deleteSpotlightAction({ id: spotlight.id });
      reloadOnSuccess(res);
    });
  }

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const uploaded = await uploadSpotlightPhoto(file);
        setForm((current) => ({
          ...current,
          photoUrl: uploaded.secure_url,
          photoPublicId: uploaded.public_id,
        }));
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err, "Unable to upload spotlight photo"));
      } finally {
        e.target.value = "";
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <section className="admin-module h-fit rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Spotlight Desk
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {editingId ? "Edit weekly feature" : "Create weekly feature"}
            </h2>
          </div>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={resetForm}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4">
          <div>
            <label className={labelClass}>Featured member</label>
            <select
              value={form.featuredUserId}
              onChange={(e) => selectFeaturedUser(e.target.value)}
              className={inputClass}
            >
              <option value="">Manual spotlight</option>
              {featuredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {displayUser(user)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Display name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Emmanuel Raphael"
            />
          </div>

          <div>
            <label className={labelClass}>Week starts</label>
            <input
              type="date"
              value={form.weekStart}
              onChange={(e) =>
                setForm((current) => ({ ...current, weekStart: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
              <Image
                src={previewPhoto}
                alt={form.name || "Spotlight preview"}
                fill
                sizes="380px"
                className={previewPhoto === "/logo.svg" ? "object-contain p-10" : "object-cover"}
              />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPickPhoto}
                  className="hidden"
                  disabled={isPending}
                />
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                Upload photo
              </label>
              {form.photoUrl ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/82 transition hover:bg-white/[0.08]"
                  onClick={() =>
                    setForm((current) => ({ ...current, photoUrl: "", photoPublicId: "" }))
                  }
                  disabled={isPending}
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <div>
            <label className={labelClass}>Story</label>
            <textarea
              value={form.story}
              onChange={(e) => setForm((current) => ({ ...current, story: e.target.value }))}
              rows={5}
              className={inputClass}
              placeholder="Tell the member story in a warm, public-facing way."
            />
          </div>

          <div>
            <label className={labelClass}>Musical journey</label>
            <textarea
              value={form.musicalJourney}
              onChange={(e) =>
                setForm((current) => ({ ...current, musicalJourney: e.target.value }))
              }
              rows={4}
              className={inputClass}
              placeholder="How they started, grew, served, and found their sound."
            />
          </div>

          <div>
            <label className={labelClass}>Favorite song</label>
            <input
              value={form.favoriteSong}
              onChange={(e) =>
                setForm((current) => ({ ...current, favoriteSong: e.target.value }))
              }
              className={inputClass}
              placeholder="e.g. Chineke Odogwu"
            />
          </div>

          <div>
            <label className={labelClass}>Advice</label>
            <textarea
              value={form.advice}
              onChange={(e) => setForm((current) => ({ ...current, advice: e.target.value }))}
              rows={3}
              className={inputClass}
              placeholder="A short word for singers, instrumentalists, or new members."
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/85">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) =>
                setForm((current) => ({ ...current, isPublished: e.target.checked }))
              }
              className="h-4 w-4 accent-white"
            />
            Publish spotlight
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-2xl"
              onClick={submitSpotlight}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingId ? "Save spotlight" : "Create spotlight"}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={resetForm}
                disabled={isPending}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Story Archive
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">All spotlights</h2>
          </div>
          <Badge className="w-fit rounded-full bg-white/10 text-white hover:bg-white/10">
            {spotlights.length} total
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {spotlights.map((spotlight) => {
            const photo = spotlight.photoUrl || spotlight.featuredUser?.image || "/logo.svg";
            return (
              <article
                key={spotlight.id}
                className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/24"
              >
                <div className="relative aspect-[4/3] bg-black">
                  <Image
                    src={photo}
                    alt={spotlight.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 36vw"
                    className={photo === "/logo.svg" ? "object-contain p-12" : "object-cover"}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))]" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        className={
                          spotlight.isPublished
                            ? "rounded-full bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20"
                            : "rounded-full bg-amber-500/15 text-amber-100 hover:bg-amber-500/20"
                        }
                      >
                        {spotlight.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(spotlight.weekStart)}
                      </Badge>
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-white">
                      {spotlight.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5">
                  <p className="line-clamp-3 text-sm leading-7 text-white/62">
                    {spotlight.story}
                  </p>
                  <div className="mt-4 grid gap-2">
                    <div className="flex items-center gap-2 text-xs text-white/45">
                      <UserRound className="h-4 w-4 text-cyan-100/80" />
                      {spotlight.featuredUser?.email ?? "Manual spotlight"}
                    </div>
                    {spotlight.favoriteSong ? (
                      <div className="flex items-center gap-2 text-xs text-white/45">
                        <Music2 className="h-4 w-4 text-amber-100/80" />
                        {spotlight.favoriteSong}
                      </div>
                    ) : null}
                    {spotlight.advice ? (
                      <div className="flex items-center gap-2 text-xs text-white/45">
                        <Quote className="h-4 w-4 text-emerald-100/80" />
                        {spotlight.advice}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                      onClick={() => beginEdit(spotlight)}
                      disabled={isPending}
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                      onClick={() => removeSpotlight(spotlight)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}

          {spotlights.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-center lg:col-span-2">
              <Sparkles className="mx-auto h-8 w-8 text-amber-100" />
              <h3 className="mt-4 text-xl font-semibold text-white">
                No weekly spotlight yet.
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-white/58">
                Create the first spotlight to activate the public community page and homepage card.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
