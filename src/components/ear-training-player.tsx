"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, Loader2, Volume2 } from "lucide-react";

import {
  getEarTrainingMidiPitches,
  getEarTrainingSoundLabel,
  midiToFrequency,
  type EarTrainingSoundConfig,
} from "@/lib/ear-training";

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

type EarTrainingPlayerProps = {
  config: EarTrainingSoundConfig | null;
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

function scheduleTone(
  context: AudioContext,
  midi: number,
  startTime: number,
  duration: number,
  gainLevel: number
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(midiToFrequency(midi), startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.04);
}

function scheduleSound(context: AudioContext, config: EarTrainingSoundConfig) {
  const start = context.currentTime + 0.08;
  const pitches = getEarTrainingMidiPitches(config);

  if (config.mode === "interval") {
    if (config.playback === "harmonic") {
      pitches.forEach((pitch) => scheduleTone(context, pitch, start, 1.35, 0.09));
      return 1.5;
    }

    scheduleTone(context, pitches[0], start, 0.72, 0.14);
    scheduleTone(context, pitches[1], start + 0.78, 0.86, 0.14);
    return 1.78;
  }

  if (config.playback === "broken") {
    pitches.forEach((pitch, index) => {
      scheduleTone(context, pitch, start + index * 0.28, 0.5, 0.11);
    });
    pitches.forEach((pitch) => {
      scheduleTone(context, pitch, start + pitches.length * 0.28 + 0.22, 1.1, 0.07);
    });
    return pitches.length * 0.28 + 1.5;
  }

  pitches.forEach((pitch) => scheduleTone(context, pitch, start, 1.45, 0.07));
  return 1.6;
}

export function EarTrainingPlayer({
  config,
  title = "Listen first",
  description,
  compact = false,
  className,
}: EarTrainingPlayerProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      void audioContextRef.current?.close();
    };
  }, []);

  if (!config) return null;

  async function playSound() {
    if (!config) return;

    const AudioContextClass =
      window.AudioContext ?? (window as AudioWindow).webkitAudioContext;

    if (!AudioContextClass) {
      setError("Audio playback is not supported in this browser.");
      return;
    }

    try {
      setError(null);
      setIsPlaying(true);

      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new AudioContextClass();
      }

      const context = audioContextRef.current;
      if (context.state === "suspended") await context.resume();

      const duration = scheduleSound(context, config);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setIsPlaying(false), duration * 1000 + 200);
    } catch {
      setIsPlaying(false);
      setError("Unable to play this example right now.");
    }
  }

  const soundLabel = getEarTrainingSoundLabel(config);

  return (
    <div
      className={`rounded-[1.5rem] border border-amber-200/16 bg-amber-200/[0.065] ${
        compact ? "p-4" : "p-5"
      } ${className ?? ""}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200/18 bg-black/24 text-amber-100">
            <Headphones className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 text-sm leading-6 text-white/62">
              {description ?? soundLabel}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={playSound}
          disabled={isPlaying}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-200/28 bg-amber-200 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-70"
        >
          {isPlaying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          {isPlaying ? "Playing" : "Play sound"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}
