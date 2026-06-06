"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, Mic, RotateCcw, Timer, Volume2 } from "lucide-react";

import { submitSightReadingAttemptAction } from "@/app/music-hub/sight-reading/actions";
import { ShareActions } from "@/components/share-actions";
import { Button } from "@/components/ui/button";
import { SightReadingSheet } from "@/components/sight-reading-sheet";
import {
  frequencyToMidi,
  getExerciseDurationMs,
  midiToNearestSightReadingPitch,
  noteToMidi,
  type SightReadingExercise,
  type SightReadingNoteResult,
  type SightReadingScorePayload,
} from "@/lib/sight-reading";

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

type PitchFrame = {
  timeMs: number;
  frequency: number | null;
};

type CoachFeedback = {
  summary: string;
  strengths: string[];
  improvements: string[];
  nextStep: string;
};

type SightSingingPracticeProps = {
  exercise: SightReadingExercise;
  sourceType: "daily-challenge" | "challenge";
  sourceId: string;
  isSignedIn: boolean;
};

const captureIntervalMs = 70;

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getCountInBeats(timeSignature: string) {
  const beats = Number(timeSignature.split("/")[0]);
  return Number.isFinite(beats) ? Math.max(2, Math.min(4, beats)) : 4;
}

function autoCorrelate(buffer: Float32Array, sampleRate: number) {
  let rms = 0;
  for (const sample of buffer) rms += sample * sample;
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.012) return null;

  let start = 0;
  let end = buffer.length - 1;
  const threshold = 0.2;

  for (let index = 0; index < buffer.length / 2; index += 1) {
    if (Math.abs(buffer[index]) < threshold) {
      start = index;
      break;
    }
  }

  for (let index = 1; index < buffer.length / 2; index += 1) {
    if (Math.abs(buffer[buffer.length - index]) < threshold) {
      end = buffer.length - index;
      break;
    }
  }

  const slice = buffer.slice(start, end);
  const correlations = new Array<number>(slice.length).fill(0);

  for (let offset = 0; offset < slice.length; offset += 1) {
    for (let index = 0; index < slice.length - offset; index += 1) {
      correlations[offset] += slice[index] * slice[index + offset];
    }
  }

  let offset = 0;
  while (correlations[offset] > correlations[offset + 1]) offset += 1;

  let maxValue = -1;
  let maxPosition = -1;
  for (let index = offset; index < correlations.length; index += 1) {
    if (correlations[index] > maxValue) {
      maxValue = correlations[index];
      maxPosition = index;
    }
  }

  if (maxPosition <= 0) return null;
  const frequency = sampleRate / maxPosition;
  return frequency >= 70 && frequency <= 1100 ? frequency : null;
}

function scheduleBeep(context: AudioContext, time: number, high: boolean) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(high ? 1046.5 : 784, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(high ? 0.16 : 0.11, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.13);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + 0.16);
}

function analyzePerformance(
  exercise: SightReadingExercise,
  frames: PitchFrame[]
): SightReadingScorePayload {
  const beatMs = 60_000 / exercise.tempoBpm;
  let cursor = 0;

  const noteFrames = exercise.notes.map((note, index) => {
    const start = cursor * beatMs;
    const end = (cursor + note.beats) * beatMs;
    cursor += note.beats;

    const padding = Math.min(110, (end - start) * 0.18);
    const framesInWindow = frames.filter(
      (frame) => frame.timeMs >= start + padding && frame.timeMs <= end - padding
    );
    const voiced = framesInWindow
      .filter((frame) => frame.frequency)
      .map((frame) => frequencyToMidi(frame.frequency!));

    return {
      index,
      expectedMidi: noteToMidi(note.pitch),
      expectedPitch: note.pitch,
      actualMidi: median(voiced),
      voiced,
      coverage: framesInWindow.length > 0 ? voiced.length / framesInWindow.length : 0,
    };
  });

  const offsets = noteFrames
    .filter((note) => note.actualMidi !== null)
    .map((note) => note.actualMidi! - note.expectedMidi);
  const transpositionSemitones = median(offsets) ?? 0;

  const noteResults: SightReadingNoteResult[] = noteFrames.map((note) => {
    if (note.actualMidi === null) {
      return {
        index: note.index,
        expectedPitch: note.expectedPitch,
        sungPitch: null,
        pitchErrorSemitones: null,
        coverage: Number(note.coverage.toFixed(2)),
      };
    }

    const normalizedMidi = note.actualMidi - transpositionSemitones;
    return {
      index: note.index,
      expectedPitch: note.expectedPitch,
      sungPitch: midiToNearestSightReadingPitch(normalizedMidi),
      pitchErrorSemitones: Number((normalizedMidi - note.expectedMidi).toFixed(2)),
      coverage: Number(note.coverage.toFixed(2)),
    };
  });

  const notePitchScores = noteResults.map((note) => {
    if (note.pitchErrorSemitones === null) return 0;
    return Math.max(0, 100 - Math.abs(note.pitchErrorSemitones) * 58);
  });
  const pitchScore = clampScore(
    notePitchScores.reduce((sum, value) => sum + value, 0) / notePitchScores.length
  );

  const rhythmScore = clampScore(
    (noteResults.reduce((sum, note) => sum + note.coverage, 0) / noteResults.length) * 100
  );

  const stabilityValues = noteFrames
    .filter((note) => note.voiced.length >= 3)
    .map((note) => standardDeviation(note.voiced));
  const averageStability = median(stabilityValues) ?? 1.2;
  const stabilityScore = clampScore(100 - averageStability * 70);

  return {
    score: clampScore(pitchScore * 0.62 + rhythmScore * 0.25 + stabilityScore * 0.13),
    pitchScore,
    rhythmScore,
    stabilityScore,
    transpositionSemitones: Number(transpositionSemitones.toFixed(2)),
    noteResults,
  };
}

export function SightSingingPractice({
  exercise,
  sourceType,
  sourceId,
  isSignedIn,
}: SightSingingPracticeProps) {
  const [stage, setStage] = useState<"idle" | "counting" | "recording" | "processing">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SightReadingScorePayload | null>(null);
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
  const [saved, setSaved] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countInRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const framesRef = useRef<PitchFrame[]>([]);

  const durationMs = useMemo(() => getExerciseDurationMs(exercise), [exercise]);
  const beatMs = 60_000 / exercise.tempoBpm;
  const sharePath = sourceType === "daily-challenge" ? "/music-hub/daily-challenge" : undefined;

  function cleanupAudio() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countInRef.current) clearTimeout(countInRef.current);
    if (stopRef.current) clearTimeout(stopRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void contextRef.current?.close();
    intervalRef.current = null;
    countInRef.current = null;
    stopRef.current = null;
    streamRef.current = null;
    contextRef.current = null;
    analyserRef.current = null;
  }

  useEffect(() => {
    return () => cleanupAudio();
  }, []);

  function capturePitchFrame() {
    const analyser = analyserRef.current;
    const context = contextRef.current;
    if (!analyser || !context) return;

    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    const frequency = autoCorrelate(buffer, context.sampleRate);
    framesRef.current.push({
      timeMs: performance.now() - startedAtRef.current,
      frequency,
    });
  }

  async function finishRecording() {
    if (stage === "processing") return;
    setStage("processing");
    cleanupAudio();

    const scorePayload = analyzePerformance(exercise, framesRef.current);
    setResult(scorePayload);
    setFeedback(null);
    setSaved(false);

    const res = await submitSightReadingAttemptAction({
      sourceType,
      sourceId,
      exerciseTitle: exercise.title,
      ...scorePayload,
    });

    if (res.ok) {
      setFeedback(res.feedback);
      setSaved(res.saved);
    } else {
      setFeedback({
        summary: "Your local scoring completed, but coaching feedback could not be saved.",
        strengths: ["The browser still measured pitch, rhythm, and stability."],
        improvements: [res.error],
        nextStep: "Try again after refreshing the page.",
      });
    }

    setStage("idle");
  }

  async function startRecording() {
    setError(null);
    setResult(null);
    setFeedback(null);
    setSaved(false);
    framesRef.current = [];

    const AudioContextClass =
      window.AudioContext ?? (window as AudioWindow).webkitAudioContext;

    if (!AudioContextClass) {
      setError("This browser does not support audio analysis.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const context = new AudioContextClass();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.1;

      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);

      streamRef.current = stream;
      contextRef.current = context;
      analyserRef.current = analyser;

      const countInBeats = getCountInBeats(exercise.timeSignature);
      const now = context.currentTime + 0.08;
      for (let index = 0; index < countInBeats; index += 1) {
        scheduleBeep(context, now + (index * beatMs) / 1000, index === 0);
      }

      setStage("counting");
      countInRef.current = setTimeout(() => {
        startedAtRef.current = performance.now();
        setStage("recording");
        intervalRef.current = setInterval(capturePitchFrame, captureIntervalMs);
        stopRef.current = setTimeout(() => {
          void finishRecording();
        }, durationMs + 400);
      }, countInBeats * beatMs);
    } catch {
      cleanupAudio();
      setStage("idle");
      setError("Microphone access is needed to score your singing.");
    }
  }

  const active = stage === "counting" || stage === "recording";

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)] md:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/62">
            AI Sight-Singing Check
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Sing the sheet, keep the beat.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/62">
            {exercise.instruction} Your starting key is ignored; the score checks relative
            pitch, rhythm coverage, and tone stability.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/22 px-3 py-1.5 text-xs font-semibold text-white/68">
          <Timer className="h-3.5 w-3.5" />
          {Math.round(durationMs / 1000)} sec
        </span>
      </div>

      <div className="mt-6">
        <SightReadingSheet exercise={exercise} />
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          className="min-h-12 rounded-2xl bg-amber-200 px-6 text-black hover:bg-amber-100"
          disabled={stage === "processing" || active}
          onClick={startRecording}
        >
          {stage === "processing" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {stage === "processing"
            ? "Checking..."
            : stage === "counting"
              ? "Count-in..."
              : stage === "recording"
                ? "Recording..."
                : "Start with count-in"}
        </Button>

        {active ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-12 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={() => void finishRecording()}
          >
            Finish now
          </Button>
        ) : null}

        {result ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-12 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={() => {
              setResult(null);
              setFeedback(null);
              setSaved(false);
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </Button>
        ) : null}
      </div>

      {stage === "counting" ? (
        <div className="mt-5 rounded-2xl border border-amber-200/18 bg-amber-200/10 p-4 text-sm text-amber-50">
          <Volume2 className="mr-2 inline h-4 w-4" />
          Count-in is playing. Start singing after the beeps.
        </div>
      ) : null}

      {!isSignedIn ? (
        <p className="mt-4 text-sm leading-6 text-white/48">
          You can practice without logging in. Sign in to save attempts to your profile.
        </p>
      ) : null}

      {result ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="rounded-[1.5rem] border border-emerald-300/18 bg-emerald-300/10 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/72">
              Score
            </p>
            <p className="mt-3 text-5xl font-semibold text-white">{result.score}</p>
            <div className="mt-5 grid gap-2 text-sm text-white/68">
              <p>Pitch: {result.pitchScore}</p>
              <p>Rhythm: {result.rhythmScore}</p>
              <p>Stability: {result.stabilityScore}</p>
              <p>Key offset ignored: {result.transpositionSemitones.toFixed(1)} semitones</p>
            </div>
            {saved ? (
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
                Saved to profile
              </p>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-black/24 p-5">
            <h3 className="text-lg font-semibold text-white">Coach feedback</h3>
            {feedback ? (
              <div className="mt-4 grid gap-4 text-sm leading-7 text-white/68">
                <p>{feedback.summary}</p>
                <div>
                  <p className="font-semibold text-white">Strengths</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {feedback.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-white">Improve next</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {feedback.improvements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <p className="rounded-2xl border border-amber-200/14 bg-amber-200/[0.06] p-4 text-amber-50/86">
                  {feedback.nextStep}
                </p>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-sm text-white/58">
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing feedback...
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-amber-200/12 bg-amber-200/[0.065] p-5 lg:col-span-2">
            <p className="text-sm font-semibold text-white">Share this challenge</p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Invite another singer to try the sheet and compare practice results.
            </p>
            <ShareActions
              className="mt-4"
              title={`JNC Sight-Singing Challenge: ${exercise.title}`}
              text={`I scored ${result.score} on a JNC sight-singing challenge. Try it too.`}
              path={sharePath}
              shareLabel="Share challenge"
              copyLabel="Copy challenge link"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
