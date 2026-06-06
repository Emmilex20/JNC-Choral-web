"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Music2,
  PlayCircle,
  Trophy,
  Upload,
  Vote,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareActions } from "@/components/share-actions";
import { SightSingingPractice } from "@/components/sight-singing-practice";
import { getErrorMessage } from "@/lib/errors";
import type { SightReadingExercise } from "@/lib/sight-reading";
import {
  submitChallengeSubmissionAction,
  voteChallengeSubmissionAction,
} from "../actions";

type MediaType = "TEXT" | "AUDIO" | "VIDEO";

type ChallengeForClient = {
  id: string;
  title: string;
  slug: string;
  type: string;
  description: string | null;
  prompt: string | null;
  rules: string | null;
  coverImageUrl: string | null;
  sightReadingExercise: SightReadingExercise | null;
  startsAt: string | null;
  endsAt: string | null;
};

type SubmissionForClient = {
  id: string;
  userId: string | null;
  title: string | null;
  description: string;
  mediaType: string;
  audioUrl: string | null;
  videoUrl: string | null;
  isWinner: boolean;
  createdAt: string;
  voteCount: number;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
};

type SignatureResponse = {
  timestamp: number;
  signature: string;
  folder: string;
  cloudName: string;
  apiKey: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
};

const maxUploadBytes = 250 * 1024 * 1024;

function displayName(submission: SubmissionForClient) {
  return (
    submission.user?.name ||
    submission.user?.email?.split("@")[0] ||
    "JNC participant"
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getMediaType(file?: File | null): MediaType {
  if (!file) return "TEXT";
  return file.type.startsWith("video/") ? "VIDEO" : "AUDIO";
}

async function getSignature() {
  const res = await fetch("/api/music-hub/challenges/upload-signature");
  if (!res.ok) throw new Error("Sign in again before uploading.");
  return (await res.json()) as SignatureResponse;
}

async function uploadChallengeMedia(file: File) {
  const sig = await getSignature();
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`, {
    method: "POST",
    body: form,
  });

  if (!up.ok) throw new Error("Upload failed");
  const uploaded = (await up.json()) as CloudinaryUploadResponse;
  if (!uploaded.secure_url || !uploaded.public_id) {
    throw new Error("Upload did not return a media URL");
  }
  return uploaded;
}

export default function ChallengeDetailClient({
  challenge,
  submissions,
  isSignedIn,
  currentUserId,
  currentVoteSubmissionId,
}: {
  challenge: ChallengeForClient;
  submissions: SubmissionForClient[];
  isSignedIn: boolean;
  currentUserId: string | null;
  currentVoteSubmissionId: string | null;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSignedIn) {
      setNotice({ type: "error", message: "Sign in to submit your entry." });
      return;
    }

    setPending(true);
    setNotice(null);
    try {
      if (
        file &&
        !file.type.startsWith("audio/") &&
        !file.type.startsWith("video/")
      ) {
        setNotice({ type: "error", message: "Upload an audio or video file." });
        return;
      }

      if (file && file.size > maxUploadBytes) {
        setNotice({
          type: "error",
          message: "Please keep challenge uploads under 250 MB.",
        });
        return;
      }

      const mediaType = getMediaType(file);
      const uploaded = file ? await uploadChallengeMedia(file) : null;
      const res = await submitChallengeSubmissionAction({
        challengeId: challenge.id,
        title,
        description,
        mediaType,
        audioUrl: mediaType === "AUDIO" ? uploaded?.secure_url : undefined,
        videoUrl: mediaType === "VIDEO" ? uploaded?.secure_url : undefined,
        mediaPublicId: uploaded?.public_id,
      });

      if (!res.ok) {
        setNotice({ type: "error", message: res.error });
        return;
      }

      setTitle("");
      setDescription("");
      setFile(null);
      setNotice({ type: "success", message: res.message });
    } catch (error) {
      setNotice({ type: "error", message: getErrorMessage(error, "Unable to submit entry") });
    } finally {
      setPending(false);
    }
  }

  async function voteFor(submissionId: string) {
    setPending(true);
    setNotice(null);
    try {
      const res = await voteChallengeSubmissionAction({
        challengeId: challenge.id,
        submissionId,
      });

      if (!res.ok) {
        setNotice({ type: "error", message: res.error });
        return;
      }

      window.location.reload();
    } catch (error) {
      setNotice({ type: "error", message: getErrorMessage(error, "Unable to cast vote") });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:px-6 lg:grid-cols-[420px_minmax(0,1fr)] lg:py-14">
      <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-black">
          {challenge.coverImageUrl ? (
            <Image
              src={challenge.coverImageUrl}
              alt={challenge.title}
              fill
              sizes="420px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(34,211,238,0.12))]">
              <Trophy className="h-16 w-16 text-amber-100" />
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge className="rounded-full bg-amber-200/12 text-amber-50 hover:bg-amber-200/12">
            {challenge.type}
          </Badge>
          <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
            {submissions.length} public entries
          </Badge>
        </div>
        {challenge.prompt ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/24 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/42">Prompt</p>
            <p className="mt-2 text-sm leading-7 text-white/68">{challenge.prompt}</p>
          </div>
        ) : null}
        {challenge.rules ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/24 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/42">Rules</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-white/68">
              {challenge.rules}
            </p>
          </div>
        ) : null}
      </aside>

      <div className="grid gap-6">
        {challenge.sightReadingExercise ? (
          <SightSingingPractice
            exercise={challenge.sightReadingExercise}
            sourceType="challenge"
            sourceId={challenge.id}
            isSignedIn={isSignedIn}
          />
        ) : null}

        <form
          onSubmit={submit}
          className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)] md:p-7"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                Submit Entry
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Add your performance
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/22 px-3 py-1.5 text-xs font-semibold text-white/68">
              <Upload className="h-3.5 w-3.5" />
              Audio, video, or text
            </span>
          </div>

          {!isSignedIn ? (
            <div className="mt-5 rounded-2xl border border-amber-200/20 bg-amber-200/10 p-4 text-sm leading-7 text-amber-50">
              Sign in to upload a challenge entry and vote for other performers.{" "}
              <Link href="/auth/login" className="font-semibold underline">
                Log in
              </Link>
            </div>
          ) : null}

          {notice ? (
            <div
              className={`mt-5 rounded-2xl border p-4 text-sm leading-6 ${
                notice.type === "success"
                  ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                  : "border-red-400/20 bg-red-500/10 text-red-100"
              }`}
            >
              {notice.message}
            </div>
          ) : null}

          {notice?.type === "success" ? (
            <ShareActions
              className="mt-4"
              title={`JNC Challenge: ${challenge.title}`}
              text={`I just submitted an entry for ${challenge.title} on JNC. Join the challenge or share your vote.`}
              path={`/music-hub/challenges/${challenge.slug}`}
              shareLabel="Share challenge"
              copyLabel="Copy challenge link"
            />
          ) : null}

          <div className="mt-5 grid gap-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isSignedIn || pending}
              className="w-full rounded-2xl border border-white/10 bg-black/34 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-amber-200/40"
              placeholder="Optional title for your entry"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isSignedIn || pending}
              rows={5}
              className="w-full rounded-2xl border border-white/10 bg-black/34 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-amber-200/40"
              placeholder="Describe your entry, arrangement idea, or performance approach."
            />
            <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-white/14 bg-black/24 p-4 text-sm text-white/70 transition hover:border-amber-200/28 hover:bg-white/[0.04]">
              <input
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                disabled={!isSignedIn || pending}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <span className="inline-flex items-center gap-2 font-semibold text-white">
                <Upload className="h-4 w-4 text-amber-100" />
                {file ? file.name : "Upload audio or video"}
              </span>
              <span>Leave empty for a text-only submission.</span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={!isSignedIn || pending}
            className="mt-5 min-h-12 rounded-2xl bg-amber-200 px-6 text-black hover:bg-amber-100"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {pending ? "Submitting..." : "Submit for review"}
          </Button>
        </form>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                Public Entries
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Vote for a performer
              </h2>
            </div>
            <Badge className="w-fit rounded-full bg-white/10 text-white hover:bg-white/10">
              One vote per challenge
            </Badge>
          </div>

          <div className="mt-6 grid gap-4">
            {submissions.map((submission) => {
              const hasVoted = currentVoteSubmissionId === submission.id;
              const isOwnSubmission = currentUserId === submission.userId;
              return (
                <article
                  key={submission.id}
                  className="rounded-[1.5rem] border border-white/10 bg-black/24 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        {submission.isWinner ? (
                          <Badge className="rounded-full bg-amber-200 text-black hover:bg-amber-200">
                            <Trophy className="h-3.5 w-3.5" />
                            Winner
                          </Badge>
                        ) : null}
                        <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                          {submission.mediaType}
                        </Badge>
                        <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                          {formatDate(submission.createdAt)}
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold text-white">
                        {submission.title || `${displayName(submission)} entry`}
                      </h3>
                      <p className="mt-1 text-sm text-white/45">{displayName(submission)}</p>
                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/64">
                        {submission.description}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 md:items-end">
                      <p className="text-2xl font-semibold text-white">{submission.voteCount}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/42">Votes</p>
                      <Button
                        type="button"
                        disabled={!isSignedIn || pending || Boolean(currentVoteSubmissionId) || isOwnSubmission}
                        onClick={() => voteFor(submission.id)}
                        className="mt-2 rounded-2xl bg-amber-200 text-black hover:bg-amber-100 disabled:opacity-55"
                      >
                        {hasVoted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Vote className="h-4 w-4" />
                        )}
                        {hasVoted ? "Voted" : isOwnSubmission ? "Your entry" : "Vote"}
                      </Button>
                    </div>
                  </div>

                  {submission.videoUrl ? (
                    <video
                      src={submission.videoUrl}
                      controls
                      playsInline
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
                      <FileText className="h-4 w-4 text-cyan-100" />
                      Text-only entry
                    </div>
                  )}
                </article>
              );
            })}

            {submissions.length === 0 ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-7 text-center">
                <PlayCircle className="mx-auto h-9 w-9 text-amber-100" />
                <h3 className="mt-4 text-xl font-semibold text-white">No approved entries yet.</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-white/58">
                  Submit your entry and it will appear here after admin moderation.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
