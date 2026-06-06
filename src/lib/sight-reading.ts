export const sightReadingPitches = [
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  "C5",
  "D5",
  "E5",
  "F5",
  "G5",
] as const;

export const sightReadingDurations = [0.5, 1, 1.5, 2] as const;
export const sightReadingTimeSignatures = ["2/4", "3/4", "4/4"] as const;

export type SightReadingPitch = (typeof sightReadingPitches)[number];
export type SightReadingDuration = (typeof sightReadingDurations)[number];
export type SightReadingTimeSignature = (typeof sightReadingTimeSignatures)[number];

export type SightReadingNote = {
  pitch: SightReadingPitch;
  beats: SightReadingDuration;
  syllable?: string;
};

export type SightReadingExercise = {
  title: string;
  instruction: string;
  tempoBpm: number;
  timeSignature: SightReadingTimeSignature;
  keySignature: string;
  notes: SightReadingNote[];
};

export type SightReadingNoteResult = {
  index: number;
  expectedPitch: SightReadingPitch;
  sungPitch: string | null;
  pitchErrorSemitones: number | null;
  coverage: number;
};

export type SightReadingScorePayload = {
  score: number;
  pitchScore: number;
  rhythmScore: number;
  stabilityScore: number;
  transpositionSemitones: number;
  noteResults: SightReadingNoteResult[];
};

const pitchToMidiMap: Record<SightReadingPitch, number> = {
  C4: 60,
  D4: 62,
  E4: 64,
  F4: 65,
  G4: 67,
  A4: 69,
  B4: 71,
  C5: 72,
  D5: 74,
  E5: 76,
  F5: 77,
  G5: 79,
};

const midiToPitchLabels = Object.entries(pitchToMidiMap).reduce(
  (map, [pitch, midi]) => {
    map[midi] = pitch as SightReadingPitch;
    return map;
  },
  {} as Record<number, SightReadingPitch>
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSightReadingPitch(value: unknown): value is SightReadingPitch {
  return sightReadingPitches.some((pitch) => pitch === value);
}

function normalizePitch(value: unknown): SightReadingPitch | null {
  if (isSightReadingPitch(value)) return value;
  if (typeof value !== "string") return null;

  const clean = value.trim();
  if (!clean) return null;

  const compact = clean.toUpperCase().replace(/\s+/g, "");
  if (isSightReadingPitch(compact)) return compact;

  const solfegeMap: Record<string, string> = {
    DO: "C",
    RE: "D",
    MI: "E",
    FA: "F",
    SOL: "G",
    SO: "G",
    LA: "A",
    TI: "B",
    SI: "B",
  };
  const solfege = compact.replace(/[^A-Z]/g, "");
  if (solfegeMap[solfege]) {
    const pitch = `${solfegeMap[solfege]}4`;
    return isSightReadingPitch(pitch) ? pitch : null;
  }

  const noteMatch = clean.match(/^([A-Ga-g])\s*(?:[#♯]|b|♭)?\s*([45])?$/);
  if (noteMatch) {
    const octave = noteMatch[2] ?? "4";
    const pitch = `${noteMatch[1].toUpperCase()}${octave}`;
    if (isSightReadingPitch(pitch)) return pitch;

    const fallbackPitch = `${noteMatch[1].toUpperCase()}4`;
    return isSightReadingPitch(fallbackPitch) ? fallbackPitch : null;
  }

  const firstPitchToken = clean.match(/\b([A-Ga-g])\s*(?:[#♯]|b|♭)?\s*([45])?\b/);
  if (firstPitchToken) {
    return normalizePitch(`${firstPitchToken[1]}${firstPitchToken[2] ?? "4"}`);
  }

  return null;
}

function normalizeDuration(value: unknown): SightReadingDuration {
  let numeric: number | null = typeof value === "number" ? value : null;

  if (typeof value === "string") {
    const clean = value.trim().toLowerCase();
    const parsed = Number(clean);

    if (Number.isFinite(parsed)) {
      numeric = parsed;
    } else if (clean.includes("eighth") || clean.includes("quaver") || clean.includes("half beat")) {
      numeric = 0.5;
    } else if (clean.includes("dotted quarter") || clean.includes("dotted crotchet")) {
      numeric = 1.5;
    } else if (clean.includes("half note") || clean.includes("minim") || clean.includes("2 beat")) {
      numeric = 2;
    } else if (clean.includes("quarter") || clean.includes("crotchet") || clean.includes("1 beat")) {
      numeric = 1;
    }
  }

  if (numeric === null || !Number.isFinite(numeric)) return 1;

  const closest = sightReadingDurations.reduce((best, duration) =>
    Math.abs(duration - numeric) < Math.abs(best - numeric) ? duration : best
  );
  return closest;
}

function normalizeTimeSignature(value: unknown): SightReadingTimeSignature {
  if (sightReadingTimeSignatures.some((signature) => signature === value)) {
    return value as SightReadingTimeSignature;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace("-", "/").replace(/\s+/g, "");
    return sightReadingTimeSignatures.find((signature) => signature === normalized) ?? "4/4";
  }

  return "4/4";
}

function clampTempo(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 76;
  return Math.min(112, Math.max(56, Math.round(value)));
}

function readString(value: unknown, fallback: string, maxLength = 240) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function collectRawNotes(value: Record<string, unknown>) {
  const direct =
    Array.isArray(value.notes)
      ? value.notes
      : Array.isArray(value.melody)
        ? value.melody
        : Array.isArray(value.sequence)
          ? value.sequence
          : null;

  if (direct) return direct;

  if (!Array.isArray(value.measures)) return [];

  return value.measures.flatMap((measure) => {
    if (Array.isArray(measure)) return measure;
    if (isRecord(measure) && Array.isArray(measure.notes)) return measure.notes;
    return [];
  });
}

export function normalizeSightReadingExercise(value: unknown): SightReadingExercise | null {
  if (!isRecord(value)) return null;

  const notes = collectRawNotes(value)
    .map((note): SightReadingNote | null => {
      if (typeof note === "string") {
        const pitch = normalizePitch(note);
        return pitch ? { pitch, beats: 1, syllable: "la" } : null;
      }

      if (!isRecord(note)) return null;

      const stepOctave =
        typeof note.step === "string"
          ? `${note.step}${typeof note.octave === "number" ? note.octave : ""}`
          : undefined;
      const pitch = normalizePitch(note.pitch ?? note.note ?? note.tone ?? note.solfege ?? stepOctave);
      if (!pitch) return null;

      return {
        pitch,
        beats: normalizeDuration(note.beats ?? note.durationBeats ?? note.duration),
        syllable: readString(note.syllable ?? note.lyric, "la", 24),
      };
    })
    .filter((note): note is SightReadingNote => Boolean(note))
    .slice(0, 28);

  if (notes.length < 8) return null;

  return {
    title: readString(value.title, "Sight-singing exercise", 120),
    instruction: readString(
      value.instruction,
      "Sing the written notes in time. You may start in any comfortable key.",
      420
    ),
    tempoBpm: clampTempo(value.tempoBpm ?? value.tempo),
    timeSignature: normalizeTimeSignature(value.timeSignature),
    keySignature: readString(value.keySignature, "C major", 80),
    notes,
  };
}

export function noteToMidi(pitch: SightReadingPitch) {
  return pitchToMidiMap[pitch];
}

export function midiToNearestSightReadingPitch(midi: number) {
  const rounded = Math.round(midi);
  return midiToPitchLabels[rounded] ?? null;
}

export function frequencyToMidi(frequency: number) {
  return 69 + 12 * Math.log2(frequency / 440);
}

export function getExerciseTotalBeats(exercise: SightReadingExercise) {
  return exercise.notes.reduce((sum, note) => sum + note.beats, 0);
}

export function getExerciseDurationMs(exercise: SightReadingExercise) {
  return (getExerciseTotalBeats(exercise) * 60_000) / exercise.tempoBpm;
}

export function getSightReadingMeasureBeats(exercise: SightReadingExercise) {
  const [beats] = exercise.timeSignature.split("/");
  return Number(beats) || 4;
}

export function createFallbackSightReadingExercise(
  topic = "short choral sight-singing"
): SightReadingExercise {
  return {
    title: "Two-line sight-singing challenge",
    instruction: `Sing this ${topic} exercise with a steady beat. Key is not judged; interval and rhythm accuracy are.`,
    tempoBpm: 76,
    timeSignature: "4/4",
    keySignature: "C major",
    notes: [
      { pitch: "C4", beats: 1, syllable: "la" },
      { pitch: "D4", beats: 1, syllable: "la" },
      { pitch: "E4", beats: 1, syllable: "la" },
      { pitch: "G4", beats: 1, syllable: "la" },
      { pitch: "A4", beats: 1, syllable: "la" },
      { pitch: "G4", beats: 1, syllable: "la" },
      { pitch: "E4", beats: 1, syllable: "la" },
      { pitch: "D4", beats: 1, syllable: "la" },
      { pitch: "C4", beats: 1, syllable: "la" },
      { pitch: "E4", beats: 1, syllable: "la" },
      { pitch: "G4", beats: 1, syllable: "la" },
      { pitch: "C5", beats: 1, syllable: "la" },
      { pitch: "B4", beats: 1, syllable: "la" },
      { pitch: "A4", beats: 1, syllable: "la" },
      { pitch: "G4", beats: 1, syllable: "la" },
      { pitch: "C4", beats: 1, syllable: "la" },
    ],
  };
}
