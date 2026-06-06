"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { EarTrainingPlayer } from "@/components/ear-training-player";
import { ShareActions } from "@/components/share-actions";
import { Button } from "@/components/ui/button";
import type { EarTrainingSoundConfig } from "@/lib/ear-training";
import { submitDailyChallengeAttemptAction } from "../actions";

type ExistingAttempt = {
  id: string;
  selectedIndex: number;
  isCorrect: boolean;
  completionTimeSeconds: number | null;
} | null;

type DailyChallengeClientProps = {
  challenge: {
    id: string;
    title: string;
    prompt: string;
    options: string[];
    explanation: string | null;
    soundConfig: EarTrainingSoundConfig | null;
  };
  existingAttempt: ExistingAttempt;
};

type ResultState = {
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string | null;
  alreadyAnswered: boolean;
};

export default function DailyChallengeClient({
  challenge,
  existingAttempt,
}: DailyChallengeClientProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    existingAttempt?.selectedIndex ?? null
  );
  const [startedAt] = useState(() => Date.now());
  const [result, setResult] = useState<ResultState | null>(
    existingAttempt
      ? {
          selectedIndex: existingAttempt.selectedIndex,
          correctIndex: -1,
          isCorrect: existingAttempt.isCorrect,
          explanation: challenge.explanation,
          alreadyAnswered: true,
        }
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (selectedIndex === null) {
      setError("Choose an answer first.");
      return;
    }

    startTransition(async () => {
      const res = await submitDailyChallengeAttemptAction({
        challengeId: challenge.id,
        selectedIndex,
        completionTimeSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      setResult({
        selectedIndex: res.selectedIndex,
        correctIndex: res.correctIndex,
        isCorrect: res.isCorrect,
        explanation: res.explanation,
        alreadyAnswered: res.alreadyAnswered,
      });
      setError(null);
    });
  }

  const locked = Boolean(result);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/62">
            Today&apos;s theory challenge
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{challenge.title}</h2>
        </div>
        {result ? (
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              result.isCorrect
                ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                : "border-red-300/20 bg-red-400/10 text-red-100"
            }`}
          >
            {result.isCorrect ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            {result.isCorrect ? "Correct" : "Keep learning"}
          </span>
        ) : null}
      </div>

      <h3 className="mt-8 text-2xl font-semibold leading-tight text-white">
        {challenge.prompt}
      </h3>

      <EarTrainingPlayer
        config={challenge.soundConfig}
        className="mt-6"
        description="Play the generated chord or interval before choosing your answer."
      />

      <div className="mt-6 grid gap-3">
        {challenge.options.map((option, index) => {
          const selected = selectedIndex === index;
          const isCorrectAnswer = result?.correctIndex === index;
          const isWrongSelected = result && selected && !result.isCorrect;

          return (
            <button
              key={option}
              type="button"
              disabled={locked || isPending}
              onClick={() => setSelectedIndex(index)}
              className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed ${
                isCorrectAnswer
                  ? "border-emerald-300/30 bg-emerald-400/12 text-emerald-50"
                  : isWrongSelected
                    ? "border-red-300/30 bg-red-400/12 text-red-50"
                    : selected
                      ? "border-amber-200/40 bg-amber-200 text-black"
                      : "border-white/10 bg-black/24 text-white hover:border-white/20 hover:bg-white/[0.06]"
              }`}
            >
              <span className="text-sm font-semibold">{option}</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/20 text-xs font-semibold">
                {String.fromCharCode(65 + index)}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {result ? (
        <>
          <div className="mt-6 rounded-2xl border border-amber-200/12 bg-amber-200/8 p-5 text-sm leading-7 text-amber-50/84">
            {result.alreadyAnswered ? (
              <p className="font-semibold text-white">Your saved answer has already been recorded.</p>
            ) : null}
            {result.explanation ? <p className="mt-2">{result.explanation}</p> : null}
          </div>
          <ShareActions
            className="mt-4"
            title={`JNC Daily Challenge: ${challenge.title}`}
            text={
              result.isCorrect
                ? "I completed today's JNC Daily Theory Challenge correctly."
                : "I just practiced with today's JNC Daily Theory Challenge."
            }
            path="/music-hub/daily-challenge"
            shareLabel="Share challenge"
            copyLabel="Copy challenge link"
          />
        </>
      ) : (
        <Button
          type="button"
          className="mt-6 rounded-2xl bg-amber-200 px-6 py-6 text-black hover:bg-amber-100"
          disabled={isPending || selectedIndex === null}
          onClick={submit}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Submit answer
        </Button>
      )}
    </div>
  );
}
