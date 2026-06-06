"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Edit3,
  ImagePlus,
  Loader2,
  Music2,
  Save,
  Trophy,
  Trash2,
  Upload,
  Vote,
  WandSparkles,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SightReadingSheet } from "@/components/sight-reading-sheet";
import { getErrorMessage } from "@/lib/errors";
import {
  normalizeSightReadingExercise,
  type SightReadingExercise,
} from "@/lib/sight-reading";
import {
  createChallengeAction,
  deleteChallengeAction,
  deleteChallengeSubmissionAction,
  moderateChallengeSubmissionAction,
  setChallengeSubmissionWinnerAction,
  updateChallengeAction,
} from "../actions";
import {
  generateMusicChallengeDraftAction,
  generateSightReadingExerciseDraftAction,
} from "../../ai-actions";

const adminChallengeTypes = [
  "Vocal Challenge",
  "Instrument Challenge",
  "Harmony Challenge",
  "Sight Reading Challenge",
] as const;

type ChallengeRow = {
  id: string;
  title: string;
  slug: string;
  type: string;
  description: string | null;
  prompt: string | null;
  rules: string | null;
  coverImageUrl: string | null;
  coverImagePublicId: string | null;
  sightReadingExercise: SightReadingExercise | null;
  startsAt: string;
  endsAt: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  submissionCount: number;
  voteCount: number;
};

type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

type SubmissionRow = {
  id: string;
  challengeId: string;
  challengeTitle: string;
  challengeSlug: string;
  challengeType: string;
  title: string | null;
  description: string;
  mediaType: string;
  audioUrl: string | null;
  videoUrl: string | null;
  status: string;
  adminNote: string | null;
  isWinner: boolean;
  createdAt: string;
  voteCount: number;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
};

type ChallengeForm = {
  title: string;
  type: (typeof adminChallengeTypes)[number];
  description: string;
  prompt: string;
  rules: string;
  coverImageUrl: string;
  coverImagePublicId: string;
  sightReadingExercise: SightReadingExercise | null;
  startsAt: string;
  endsAt: string;
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

function emptyForm(): ChallengeForm {
  return {
    title: "",
    type: adminChallengeTypes[0],
    description: "",
    prompt: "",
    rules: "",
    coverImageUrl: "",
    coverImagePublicId: "",
    sightReadingExercise: null,
    startsAt: "",
    endsAt: "",
    isPublished: false,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function participantName(submission: SubmissionRow) {
  return submission.user?.name || submission.user?.email?.split("@")[0] || "JNC participant";
}

async function getSignature() {
  const res = await fetch("/api/admin/cloudinary-signature?folderSuffix=challenges");
  if (!res.ok) throw new Error("Failed to get upload signature");
  return (await res.json()) as SignatureResponse;
}

async function uploadCoverImage(file: File) {
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

  if (!up.ok) throw new Error("Cover image upload failed");
  return (await up.json()) as CloudinaryImageUpload;
}

export default function AdminChallengesClient({
  initialChallenges,
  initialSubmissions,
}: {
  initialChallenges: ChallengeRow[];
  initialSubmissions: SubmissionRow[];
}) {
  const [challenges] = useState(initialChallenges);
  const [submissions] = useState(initialSubmissions);
  const [form, setForm] = useState<ChallengeForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [sightGenerating, setSightGenerating] = useState(false);

  function reloadOnSuccess(result: { ok: boolean; error?: string }) {
    if (!result.ok) {
      setError(result.error ?? "Unable to save");
      return;
    }
    window.location.reload();
  }

  function resetForm() {
    setEditingId(null);
    setError(null);
    setForm(emptyForm());
  }

  function beginEdit(challenge: ChallengeRow) {
    setEditingId(challenge.id);
    setError(null);
    setForm({
      title: challenge.title,
      type: adminChallengeTypes.includes(challenge.type as (typeof adminChallengeTypes)[number])
        ? (challenge.type as (typeof adminChallengeTypes)[number])
        : adminChallengeTypes[0],
      description: challenge.description ?? "",
      prompt: challenge.prompt ?? "",
      rules: challenge.rules ?? "",
      coverImageUrl: challenge.coverImageUrl ?? "",
      coverImagePublicId: challenge.coverImagePublicId ?? "",
      sightReadingExercise: challenge.sightReadingExercise,
      startsAt: challenge.startsAt,
      endsAt: challenge.endsAt,
      isPublished: challenge.isPublished,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitChallenge() {
    setError(null);
    startTransition(async () => {
      const payload = {
        title: form.title,
        type: form.type,
        description: form.description,
        prompt: form.prompt,
        rules: form.rules,
        coverImageUrl: form.coverImageUrl,
        coverImagePublicId: form.coverImagePublicId,
        sightReadingExercise: form.sightReadingExercise,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        isPublished: form.isPublished,
      };
      const res = editingId
        ? await updateChallengeAction({ id: editingId, ...payload })
        : await createChallengeAction(payload);
      reloadOnSuccess(res);
    });
  }

  function removeChallenge(challenge: ChallengeRow) {
    if (!confirm(`Delete ${challenge.title}? This also removes related submissions and votes.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteChallengeAction({ id: challenge.id });
      reloadOnSuccess(res);
    });
  }

  function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const uploaded = await uploadCoverImage(file);
        setForm((current) => ({
          ...current,
          coverImageUrl: uploaded.secure_url,
          coverImagePublicId: uploaded.public_id,
        }));
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err, "Unable to upload cover image"));
      } finally {
        e.target.value = "";
      }
    });
  }

  function generateChallengeDraft() {
    setError(null);
    setAiGenerating(true);
    startTransition(async () => {
      const res = await generateMusicChallengeDraftAction({
        topic: aiPrompt,
        type: form.type,
      });

      if (!res.ok) {
        setError(res.error);
        setAiGenerating(false);
        return;
      }

      setForm((current) => ({
        ...current,
        title: res.data.title,
        description: res.data.description,
        prompt: res.data.prompt,
        rules: res.data.rules,
        sightReadingExercise: normalizeSightReadingExercise(res.data.sightReadingExercise),
        isPublished: false,
      }));
      setAiGenerating(false);
    });
  }

  function generateSightReadingSheet() {
    setError(null);
    setSightGenerating(true);
    startTransition(async () => {
      const res = await generateSightReadingExerciseDraftAction({
        topic: aiPrompt || form.title || form.type,
        source: "challenge",
      });

      if (!res.ok) {
        setError(res.error);
        setSightGenerating(false);
        return;
      }

      setForm((current) => ({
        ...current,
        sightReadingExercise: normalizeSightReadingExercise(res.data),
      }));
      setSightGenerating(false);
    });
  }

  function moderateSubmission(
    submission: SubmissionRow,
    status: SubmissionStatus
  ) {
    startTransition(async () => {
      const res = await moderateChallengeSubmissionAction({
        id: submission.id,
        status,
        adminNote: submission.adminNote ?? "",
      });
      reloadOnSuccess(res);
    });
  }

  function toggleWinner(submission: SubmissionRow) {
    startTransition(async () => {
      const res = await setChallengeSubmissionWinnerAction({
        id: submission.id,
        isWinner: !submission.isWinner,
      });
      reloadOnSuccess(res);
    });
  }

  function removeSubmission(submission: SubmissionRow) {
    if (!confirm("Delete this submission?")) return;
    startTransition(async () => {
      const res = await deleteChallengeSubmissionAction({ id: submission.id });
      reloadOnSuccess(res);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
      <section className="admin-module h-fit rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Challenge Desk
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {editingId ? "Edit challenge" : "Create challenge"}
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
              Cancel
            </Button>
          ) : null}
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4">
          <div className="rounded-2xl border border-amber-200/14 bg-amber-200/[0.055] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <WandSparkles className="h-4 w-4 text-amber-100" />
              OpenAI challenge assistant
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              className={`${inputClass} mt-3`}
              placeholder="Example: sight-reading hymn refrain, harmony duet, instrumental worship intro, vocal stamina..."
            />
            <Button
              type="button"
              variant="outline"
              className="mt-3 rounded-2xl border-amber-200/25 bg-black/20 text-white hover:bg-white/10"
              onClick={generateChallengeDraft}
              disabled={isPending || aiGenerating}
            >
              {aiGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <WandSparkles className="h-4 w-4" />
              )}
              {aiGenerating ? "Generating..." : "Generate challenge draft"}
            </Button>
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
              className={inputClass}
              placeholder="e.g. June Harmony Challenge"
            />
          </div>
          <div>
            <label className={labelClass}>Challenge type</label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  type: e.target.value as ChallengeForm["type"],
                }))
              }
              className={inputClass}
            >
              {adminChallengeTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((current) => ({ ...current, description: e.target.value }))
              }
              rows={3}
              className={inputClass}
              placeholder="Short public description."
            />
          </div>
          <div>
            <label className={labelClass}>Prompt</label>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm((current) => ({ ...current, prompt: e.target.value }))}
              rows={4}
              className={inputClass}
              placeholder="What should participants submit?"
            />
          </div>
          <div className="rounded-2xl border border-cyan-200/14 bg-cyan-200/[0.045] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/16 bg-black/30 text-cyan-100">
                  <Music2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Sight-singing sheet</p>
                  <p className="mt-1 text-xs leading-5 text-white/58">
                    Add notation for users to sing with the beat. The checker ignores
                    starting key and scores interval/rhythm accuracy.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl border-cyan-200/25 bg-black/20 text-white hover:bg-white/10"
                  onClick={generateSightReadingSheet}
                  disabled={isPending || aiGenerating || sightGenerating}
                >
                  {sightGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <WandSparkles className="h-4 w-4" />
                  )}
                  {sightGenerating ? "Generating..." : "Generate sheet"}
                </Button>
                {form.sightReadingExercise ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                    disabled={isPending}
                    onClick={() =>
                      setForm((current) => ({ ...current, sightReadingExercise: null }))
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>

            {form.sightReadingExercise ? (
              <div className="mt-4">
                <SightReadingSheet exercise={form.sightReadingExercise} compact />
              </div>
            ) : null}
          </div>
          <div>
            <label className={labelClass}>Rules</label>
            <textarea
              value={form.rules}
              onChange={(e) => setForm((current) => ({ ...current, rules: e.target.value }))}
              rows={4}
              className={inputClass}
              placeholder="Eligibility, file guidelines, voting rules..."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Starts at</label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) =>
                  setForm((current) => ({ ...current, startsAt: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ends at</label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) =>
                  setForm((current) => ({ ...current, endsAt: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
              {form.coverImageUrl ? (
                <Image
                  src={form.coverImageUrl}
                  alt="Challenge cover"
                  fill
                  sizes="390px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/38">
                  <Trophy className="h-12 w-12" />
                </div>
              )}
            </div>
            <label className="mt-3 inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">
              <input
                type="file"
                accept="image/*"
                onChange={onPickCover}
                className="hidden"
                disabled={isPending}
              />
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              Upload cover
            </label>
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
            Published
          </label>
          <Button
            type="button"
            className="rounded-2xl"
            onClick={submitChallenge}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editingId ? "Save challenge" : "Create challenge"}
          </Button>
        </div>
      </section>

      <div className="grid gap-6">
        <section className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                Challenge Library
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">All challenges</h2>
            </div>
            <Badge className="w-fit rounded-full bg-white/10 text-white hover:bg-white/10">
              {challenges.length} total
            </Badge>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {challenges.map((challenge) => (
              <article
                key={challenge.id}
                className="rounded-[1.5rem] border border-white/10 bg-black/24 p-5"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                    {challenge.type}
                  </Badge>
                  <Badge
                    className={
                      challenge.isPublished
                        ? "rounded-full bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20"
                        : "rounded-full bg-amber-500/15 text-amber-100 hover:bg-amber-500/20"
                    }
                  >
                    {challenge.isPublished ? "Published" : "Draft"}
                  </Badge>
                  {challenge.sightReadingExercise ? (
                    <Badge className="rounded-full bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/20">
                      Sight sheet
                    </Badge>
                  ) : null}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">{challenge.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/58">
                  {challenge.description || challenge.prompt || "No public description yet."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
                  <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1.5">
                    {challenge.submissionCount} submissions
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1.5">
                    {challenge.voteCount} votes
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {challenge.isPublished ? (
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    >
                      <Link href={`/music-hub/challenges/${challenge.slug}`} target="_blank">
                        Open
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => beginEdit(challenge)}
                    disabled={isPending}
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                    onClick={() => removeChallenge(challenge)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </article>
            ))}
            {challenges.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/60 lg:col-span-2">
                No challenges have been created yet.
              </p>
            ) : null}
          </div>
        </section>

        <section className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                Submission Moderation
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">Review entries</h2>
            </div>
            <Badge className="w-fit rounded-full bg-white/10 text-white hover:bg-white/10">
              {submissions.length} submissions
            </Badge>
          </div>

          <div className="mt-5 grid gap-4">
            {submissions.map((submission) => (
              <article
                key={submission.id}
                className="rounded-[1.5rem] border border-white/10 bg-black/24 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                        {submission.challengeType}
                      </Badge>
                      <Badge
                        className={
                          submission.status === "APPROVED"
                            ? "rounded-full bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20"
                            : submission.status === "REJECTED"
                              ? "rounded-full bg-red-500/15 text-red-100 hover:bg-red-500/20"
                              : "rounded-full bg-amber-500/15 text-amber-100 hover:bg-amber-500/20"
                        }
                      >
                        {submission.status}
                      </Badge>
                      {submission.isWinner ? (
                        <Badge className="rounded-full bg-amber-200 text-black hover:bg-amber-200">
                          <Trophy className="h-3.5 w-3.5" />
                          Winner
                        </Badge>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-white">
                      {submission.title || submission.challengeTitle}
                    </h3>
                    <p className="mt-1 text-sm text-white/45">
                      {participantName(submission)} / {formatDate(submission.createdAt)}
                    </p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/62">
                      {submission.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                      <Vote className="h-3.5 w-3.5" />
                      {submission.voteCount} votes
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                      onClick={() => moderateSubmission(submission, "APPROVED")}
                      disabled={isPending}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                      onClick={() => moderateSubmission(submission, "PENDING")}
                      disabled={isPending}
                    >
                      Pending
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                      onClick={() => moderateSubmission(submission, "REJECTED")}
                      disabled={isPending}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                      onClick={() => toggleWinner(submission)}
                      disabled={isPending}
                    >
                      <Trophy className="h-4 w-4" />
                      {submission.isWinner ? "Unmark" : "Winner"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                      onClick={() => removeSubmission(submission)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {submission.videoUrl ? (
                  <video
                    src={submission.videoUrl}
                    controls
                    preload="metadata"
                    className="mt-4 aspect-video w-full rounded-2xl bg-black object-cover"
                  />
                ) : submission.audioUrl ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                      <Music2 className="h-4 w-4 text-amber-100" />
                      Audio submission
                    </div>
                    <audio src={submission.audioUrl} controls preload="metadata" className="w-full" />
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/58">
                    <Upload className="h-4 w-4 text-cyan-100" />
                    Text-only submission
                  </div>
                )}
              </article>
            ))}
            {submissions.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/60">
                No challenge submissions yet.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
