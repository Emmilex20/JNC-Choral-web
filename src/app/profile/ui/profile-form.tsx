"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Award,
  BadgeCheck,
  Brain,
  Camera,
  CheckCircle2,
  Clock3,
  Crown,
  ImagePlus,
  Mail,
  MicVocal,
  Save,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Vote,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { updateProfileAction } from "../actions";

type ProfileFormProps = {
  name: string;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN";
  isChorister: boolean;
  choristerVerified: boolean;
  onboardingComplete: boolean;
  joinedAt: string;
  updatedAt: string;
  gamification: GamificationSummary;
  challengeStats: ChallengeStats;
};

type GamificationSummary = {
  totalPoints: number;
  rank: number | null;
  quizPoints: number;
  dailyChallengePoints: number;
  participationPoints: number;
  badges: {
    code: string;
    title: string;
    description: string;
    icon: string;
    accent: string | null;
    awardedAt: string;
  }[];
  quizHistory: {
    id: string;
    score: number;
    totalQuestions: number;
    completionTimeSeconds: number;
    createdAt: string;
    quiz: {
      title: string;
      slug: string;
      category: string;
    };
  }[];
};

type ChallengeStats = {
  entries: number;
  wins: number;
  votes: number;
  rank: number | null;
};

type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
};

type Notice = {
  type: "success" | "error" | "info";
  message: string;
};

function initialsFromName(value: string) {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "JNC";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}

function roleLabel(role: ProfileFormProps["role"]) {
  return role === "ADMIN" ? "Administrator" : "Member";
}

function choristerStatus(isChorister: boolean, verified: boolean) {
  if (verified) return "Verified chorister";
  if (isChorister) return "Chorister pending";
  return "Registered member";
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "green" | "blue";
}) {
  const toneClass = {
    neutral: "border-white/10 bg-white/6 text-white/72",
    gold: "border-amber-200/18 bg-amber-200/10 text-amber-50",
    green: "border-emerald-300/18 bg-emerald-300/10 text-emerald-100",
    blue: "border-cyan-300/18 bg-cyan-300/10 text-cyan-100",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClass}`}
    >
      {children}
    </span>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">
        {label}
      </span>
      <div className="mt-2">{children}</div>
      {hint ? <span className="mt-2 block text-xs leading-5 text-white/45">{hint}</span> : null}
    </label>
  );
}

export default function ProfileForm({
  name,
  email,
  image,
  role,
  isChorister,
  choristerVerified,
  onboardingComplete,
  joinedAt,
  updatedAt,
  gamification,
  challengeStats,
}: ProfileFormProps) {
  const { update } = useSession();
  const [saved, setSaved] = useState({ name, image: image ?? "" });
  const [form, setForm] = useState(saved);
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [uploading, setUploading] = useState(false);

  const displayName = form.name.trim() || email.split("@")[0] || "JNC Member";
  const initials = initialsFromName(displayName);
  const hasChanges = useMemo(
    () => form.name.trim() !== saved.name.trim() || form.image !== saved.image,
    [form, saved]
  );

  async function getSignature(): Promise<CloudinarySignature> {
    const res = await fetch("/api/profile/cloudinary-signature");
    if (!res.ok) throw new Error("Failed to get signature");
    return (await res.json()) as CloudinarySignature;
  }

  async function upload(file: File) {
    const sig = await getSignature();
    const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sig.apiKey);
    formData.append("timestamp", String(sig.timestamp));
    formData.append("signature", sig.signature);
    formData.append("folder", sig.folder);

    const up = await fetch(url, { method: "POST", body: formData });
    if (!up.ok) throw new Error("Upload failed");

    const uploaded = (await up.json()) as CloudinaryUploadResponse;
    if (!uploaded.secure_url) throw new Error("Upload did not return an image URL");
    return uploaded.secure_url;
  }

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setNotice(null);
    try {
      const imageUrl = await upload(file);
      setForm((current) => ({ ...current, image: imageUrl }));
      setNotice({ type: "info", message: "Photo uploaded. Save your profile to keep it." });
    } catch (err) {
      setNotice({ type: "error", message: getErrorMessage(err, "Upload error") });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(null);

    if (!hasChanges) {
      setNotice({ type: "info", message: "Your profile is already up to date." });
      return;
    }

    const payload = {
      name: form.name.trim(),
      image: form.image,
    };

    startTransition(async () => {
      const res = await updateProfileAction(payload);
      if (!res.ok) {
        setNotice({ type: "error", message: res.error });
        return;
      }

      await update({
        user: { name: payload.name, image: payload.image || undefined },
      });
      setForm(payload);
      setSaved(payload);
      setNotice({ type: "success", message: "Profile updated successfully." });
    });
  }

  const noticeClass =
    notice?.type === "error"
      ? "border-red-400/20 bg-red-500/10 text-red-100"
      : notice?.type === "success"
        ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
        : "border-amber-200/20 bg-amber-200/10 text-amber-50";

  return (
    <>
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#07111f_48%,#03151a_100%)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[1.75rem] border border-amber-200/20 bg-black/36 shadow-[0_22px_70px_rgba(0,0,0,0.38)]">
              {form.image ? (
                <Image src={form.image} alt={displayName} fill sizes="112px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(34,211,238,0.13))] text-2xl font-semibold text-white">
                  {initials}
                </div>
              )}
              <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-black/70 text-amber-100">
                <BadgeCheck className="h-4 w-4" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
                <Sparkles className="h-3.5 w-3.5" />
                Account Center
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Welcome back, {displayName}.
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm leading-6 text-white/64">
                <Mail className="h-4 w-4 text-white/42" />
                <span className="break-all">{email}</span>
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <StatusPill tone={role === "ADMIN" ? "gold" : "blue"}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {roleLabel(role)}
                </StatusPill>
                <StatusPill tone={choristerVerified ? "green" : "neutral"}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {choristerStatus(isChorister, choristerVerified)}
                </StatusPill>
                <StatusPill tone={onboardingComplete ? "green" : "gold"}>
                  <UserRound className="h-3.5 w-3.5" />
                  {onboardingComplete ? "Profile complete" : "Profile pending"}
                </StatusPill>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <div className="border-l border-white/10 pl-4">
              <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Joined</dt>
              <dd className="mt-2 text-lg font-semibold text-white">{formatDate(joinedAt)}</dd>
            </div>
            <div className="border-l border-white/10 pl-4">
              <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Updated</dt>
              <dd className="mt-2 text-lg font-semibold text-white">{formatDate(updatedAt)}</dd>
            </div>
            <div className="border-l border-white/10 pl-4">
              <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Access</dt>
              <dd className="mt-2 text-lg font-semibold text-white">{roleLabel(role)}</dd>
            </div>
            <div className="border-l border-white/10 pl-4">
              <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Record</dt>
              <dd className="mt-2 text-lg font-semibold text-white">
                {onboardingComplete ? "Current" : "Needs update"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:py-14">
        <aside className="h-fit rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/36">
            {form.image ? (
              <Image src={form.image} alt={displayName} fill sizes="176px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(16,185,129,0.16))] text-4xl font-semibold text-white">
                {initials}
              </div>
            )}
          </div>

          <div className="mt-5 text-center">
            <h2 className="text-2xl font-semibold text-white">{displayName}</h2>
            <p className="mt-2 break-all text-sm text-white/58">{email}</p>
          </div>

          <div className="mt-5 grid gap-2">
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-amber-200/25 bg-amber-200 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-100">
              <input
                type="file"
                accept="image/*"
                onChange={onPickFile}
                className="hidden"
                disabled={uploading || isPending}
              />
              {uploading ? <Camera className="h-4 w-4 animate-pulse" /> : <ImagePlus className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Upload Photo"}
            </label>
            {form.image ? (
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, image: "" }))}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/82 transition hover:bg-white/[0.08]"
              >
                <X className="h-4 w-4" />
                Remove Photo
              </button>
            ) : null}
          </div>

          <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/42">Role</p>
              <p className="mt-1 text-sm font-semibold text-white">{roleLabel(role)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/42">Choir Status</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {choristerStatus(isChorister, choristerVerified)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/42">Member Since</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatDate(joinedAt)}</p>
            </div>
          </div>
        </aside>

        <form
          onSubmit={submit}
          className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.035))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)] md:p-8"
        >
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                Profile Details
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Personal identity
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/58">
                Keep your name and portrait refined across the JNC platform.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/22 px-3 py-1.5 text-xs font-semibold text-white/68">
              <Clock3 className="h-3.5 w-3.5" />
              {hasChanges ? "Unsaved changes" : "Current"}
            </span>
          </div>

          {notice ? (
            <div
              aria-live="polite"
              className={`mt-5 rounded-2xl border p-4 text-sm leading-6 ${noticeClass}`}
            >
              {notice.message}
            </div>
          ) : null}

          <div className="mt-6 grid gap-5">
            <Field label="Full name">
              <input
                id="profile-name"
                value={form.name}
                minLength={2}
                maxLength={80}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/34 px-4 py-3.5 text-base text-white outline-none transition placeholder:text-white/28 focus:border-amber-200/40 focus:bg-black/44"
                placeholder="Your full name"
              />
            </Field>

            <Field label="Email address" hint="Email is secured on your account and cannot be edited here.">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 py-3.5 text-white/72">
                <Mail className="h-4 w-4 shrink-0 text-white/35" />
                <input
                  value={email}
                  readOnly
                  className="min-w-0 flex-1 cursor-not-allowed bg-transparent text-base outline-none"
                />
              </div>
            </Field>
          </div>

          <dl className="mt-8 grid gap-x-6 gap-y-5 border-y border-white/10 py-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Account Type</dt>
              <dd className="mt-1 text-sm font-semibold text-white">{roleLabel(role)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Onboarding</dt>
              <dd className="mt-1 text-sm font-semibold text-white">
                {onboardingComplete ? "Completed" : "Pending"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Choir Record</dt>
              <dd className="mt-1 text-sm font-semibold text-white">
                {choristerStatus(isChorister, choristerVerified)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Last Updated</dt>
              <dd className="mt-1 text-sm font-semibold text-white">{formatDate(updatedAt)}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/48">
              {hasChanges ? "Ready to save your latest profile details." : "Your profile details are current."}
            </p>
            <Button
              className="min-h-12 rounded-2xl bg-amber-200 px-6 text-black hover:bg-amber-100"
              disabled={isPending || uploading}
              type="submit"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6 lg:pb-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.032))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)] md:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                  Learning Identity
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  Points and badges
                </h2>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200/18 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-50">
                <Crown className="h-3.5 w-3.5" />
                {gamification.rank ? `Rank #${gamification.rank}` : "Unranked"}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/24 p-5">
                <div className="flex items-center gap-2 text-sm text-white/58">
                  <Trophy className="h-4 w-4 text-amber-100" />
                  Total points
                </div>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                  {gamification.totalPoints}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/24 p-5">
                <div className="flex items-center gap-2 text-sm text-white/58">
                  <Brain className="h-4 w-4 text-cyan-100" />
                  Learning points
                </div>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                  {gamification.quizPoints + gamification.dailyChallengePoints}
                </p>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Quiz</dt>
                <dd className="mt-2 text-lg font-semibold text-white">
                  {gamification.quizPoints}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Daily</dt>
                <dd className="mt-2 text-lg font-semibold text-white">
                  {gamification.dailyChallengePoints}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/42">
                  Active
                </dt>
                <dd className="mt-2 text-lg font-semibold text-white">
                  {gamification.participationPoints}
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-3xl border border-amber-200/12 bg-amber-200/[0.055] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MicVocal className="h-5 w-5 text-amber-100" />
                    <h3 className="text-lg font-semibold text-white">Challenge record</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    Track your music challenge entries, wins, and community votes.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/24 px-3 py-1.5 text-xs font-semibold text-white/68">
                  <Crown className="h-3.5 w-3.5" />
                  {challengeStats.rank ? `Rank #${challengeStats.rank}` : "Unranked"}
                </span>
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                  <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Entries</dt>
                  <dd className="mt-2 text-lg font-semibold text-white">
                    {challengeStats.entries}
                  </dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                  <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Wins</dt>
                  <dd className="mt-2 text-lg font-semibold text-white">
                    {challengeStats.wins}
                  </dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                  <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Votes</dt>
                  <dd className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
                    <Vote className="h-4 w-4 text-amber-100" />
                    {challengeStats.votes}
                  </dd>
                </div>
                <Link
                  href="/music-hub/challenges"
                  className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm font-semibold text-white transition hover:border-amber-200/24 hover:bg-white/[0.07]"
                >
                  Enter challenges
                </Link>
              </dl>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-100" />
                <h3 className="text-lg font-semibold text-white">Badge collection</h3>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {gamification.badges.length > 0 ? (
                  gamification.badges.map((badge) => (
                    <div
                      key={badge.code}
                      className="rounded-2xl border border-white/10 bg-black/24 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-2xl">
                          {badge.icon}
                        </span>
                        <div>
                          <p className="font-semibold text-white">{badge.title}</p>
                          <p className="mt-1 text-xs leading-5 text-white/54">
                            {badge.description}
                          </p>
                          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/38">
                            Awarded {formatDate(badge.awardedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/58 sm:col-span-2">
                    Badges unlock automatically as you attend rehearsals, complete quizzes, and
                    build consistency.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.032))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)] md:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                  Quiz History
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  Recent attempts
                </h2>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/22 px-3 py-1.5 text-xs font-semibold text-white/68">
                <Brain className="h-3.5 w-3.5" />
                {gamification.quizHistory.length} shown
              </span>
            </div>

            <div className="mt-6 grid gap-3">
              {gamification.quizHistory.length > 0 ? (
                gamification.quizHistory.map((attempt) => (
                  <Link
                    key={attempt.id}
                    href={`/music-hub/quizzes/${attempt.quiz.slug}/results?attemptId=${attempt.id}`}
                    className="grid gap-4 rounded-3xl border border-white/10 bg-black/24 p-4 transition hover:border-amber-200/24 hover:bg-white/[0.06] sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-white">{attempt.quiz.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/42">
                        {attempt.quiz.category} / {formatDate(attempt.createdAt)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-left sm:text-right">
                      <div>
                        <p className="text-xs text-white/42">Score</p>
                        <p className="font-semibold text-white">
                          {attempt.score}/{attempt.totalQuestions}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/42">Time</p>
                        <p className="font-semibold text-white">
                          {formatDuration(attempt.completionTimeSeconds)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-7 text-center">
                  <Brain className="mx-auto h-8 w-8 text-cyan-100" />
                  <h3 className="mt-4 text-xl font-semibold text-white">
                    No quiz history yet.
                  </h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-white/58">
                    Complete a Music Hub quiz to start building your profile record and
                    leaderboard rank.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
