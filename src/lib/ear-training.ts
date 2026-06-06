export const earTrainingRootNotes = [
  { value: "C4", label: "C4" },
  { value: "D4", label: "D4" },
  { value: "E4", label: "E4" },
  { value: "F4", label: "F4" },
  { value: "G4", label: "G4" },
  { value: "A4", label: "A4" },
  { value: "B4", label: "B4" },
  { value: "C5", label: "C5" },
] as const;

export const earTrainingIntervals = [
  { value: "minor-second", label: "Minor 2nd", semitones: 1, aliases: ["minor second"] },
  { value: "major-second", label: "Major 2nd", semitones: 2, aliases: ["major second"] },
  { value: "minor-third", label: "Minor 3rd", semitones: 3, aliases: ["minor third"] },
  { value: "major-third", label: "Major 3rd", semitones: 4, aliases: ["major third"] },
  { value: "perfect-fourth", label: "Perfect 4th", semitones: 5, aliases: ["perfect fourth"] },
  { value: "tritone", label: "Tritone", semitones: 6 },
  { value: "perfect-fifth", label: "Perfect 5th", semitones: 7, aliases: ["perfect fifth"] },
  { value: "minor-sixth", label: "Minor 6th", semitones: 8, aliases: ["minor sixth"] },
  { value: "major-sixth", label: "Major 6th", semitones: 9, aliases: ["major sixth"] },
  { value: "minor-seventh", label: "Minor 7th", semitones: 10, aliases: ["minor seventh"] },
  { value: "major-seventh", label: "Major 7th", semitones: 11, aliases: ["major seventh"] },
  { value: "octave", label: "Octave", semitones: 12 },
] as const;

export const earTrainingChords = [
  { value: "major-triad", label: "Major triad", semitones: [0, 4, 7], aliases: ["major chord"] },
  { value: "minor-triad", label: "Minor triad", semitones: [0, 3, 7], aliases: ["minor chord"] },
  { value: "diminished-triad", label: "Diminished triad", semitones: [0, 3, 6], aliases: ["diminished chord"] },
  { value: "augmented-triad", label: "Augmented triad", semitones: [0, 4, 8], aliases: ["augmented chord"] },
  { value: "suspended-fourth", label: "Suspended 4th", semitones: [0, 5, 7], aliases: ["sus4", "suspended fourth"] },
  { value: "dominant-seventh", label: "Dominant 7th", semitones: [0, 4, 7, 10], aliases: ["dominant seventh"] },
  { value: "major-seventh", label: "Major 7th", semitones: [0, 4, 7, 11], aliases: ["major seventh"] },
  { value: "minor-seventh", label: "Minor 7th", semitones: [0, 3, 7, 10], aliases: ["minor seventh"] },
] as const;

export type EarTrainingRootNote = (typeof earTrainingRootNotes)[number]["value"];
export type EarTrainingIntervalId = (typeof earTrainingIntervals)[number]["value"];
export type EarTrainingChordId = (typeof earTrainingChords)[number]["value"];
export type EarTrainingIntervalPlayback = "melodic" | "harmonic";
export type EarTrainingChordPlayback = "blocked" | "broken";

export type EarTrainingSoundConfig =
  | {
      mode: "interval";
      rootNote: EarTrainingRootNote;
      interval: EarTrainingIntervalId;
      playback: EarTrainingIntervalPlayback;
    }
  | {
      mode: "chord";
      rootNote: EarTrainingRootNote;
      chord: EarTrainingChordId;
      playback: EarTrainingChordPlayback;
    };

const rootNoteMidi: Record<EarTrainingRootNote, number> = {
  C4: 60,
  D4: 62,
  E4: 64,
  F4: 65,
  G4: 67,
  A4: 69,
  B4: 71,
  C5: 72,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isEarTrainingRootNote(value: unknown): value is EarTrainingRootNote {
  return earTrainingRootNotes.some((note) => note.value === value);
}

export function isEarTrainingIntervalId(value: unknown): value is EarTrainingIntervalId {
  return earTrainingIntervals.some((interval) => interval.value === value);
}

export function isEarTrainingChordId(value: unknown): value is EarTrainingChordId {
  return earTrainingChords.some((chord) => chord.value === value);
}

export function getEarTrainingInterval(id: EarTrainingIntervalId) {
  return earTrainingIntervals.find((interval) => interval.value === id) ?? earTrainingIntervals[3];
}

export function getEarTrainingChord(id: EarTrainingChordId) {
  return earTrainingChords.find((chord) => chord.value === id) ?? earTrainingChords[0];
}

export function getEarTrainingMidiPitches(config: EarTrainingSoundConfig) {
  const root = rootNoteMidi[config.rootNote];

  if (config.mode === "interval") {
    return [root, root + getEarTrainingInterval(config.interval).semitones];
  }

  return getEarTrainingChord(config.chord).semitones.map((semitone) => root + semitone);
}

export function getEarTrainingSoundLabel(config: EarTrainingSoundConfig) {
  if (config.mode === "interval") {
    return `${getEarTrainingInterval(config.interval).label} from ${config.rootNote}`;
  }

  return `${getEarTrainingChord(config.chord).label} on ${config.rootNote}`;
}

export function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function normalizeEarTrainingSoundConfig(
  value: unknown
): EarTrainingSoundConfig | null {
  if (!isRecord(value)) return null;

  const rootNote = isEarTrainingRootNote(value.rootNote) ? value.rootNote : "C4";

  if (value.mode === "interval") {
    if (!isEarTrainingIntervalId(value.interval)) return null;

    return {
      mode: "interval",
      rootNote,
      interval: value.interval,
      playback: value.playback === "harmonic" ? "harmonic" : "melodic",
    };
  }

  if (value.mode === "chord") {
    if (!isEarTrainingChordId(value.chord)) return null;

    return {
      mode: "chord",
      rootNote,
      chord: value.chord,
      playback: value.playback === "broken" ? "broken" : "blocked",
    };
  }

  return null;
}

function simplifyText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function includesMusicTerm(text: string, term: string) {
  const normalizedText = ` ${simplifyText(text)} `;
  return normalizedText.includes(` ${simplifyText(term)} `);
}

function getSearchTerms(item: {
  value: string;
  label: string;
  aliases?: readonly string[];
}) {
  return [item.value.replace(/-/g, " "), item.label, ...(item.aliases ?? [])];
}

export function inferEarTrainingSoundConfigFromAnswer({
  title,
  prompt,
  answer,
}: {
  title: string;
  prompt: string;
  answer: string | undefined;
}): EarTrainingSoundConfig | null {
  if (!answer) return null;

  const listeningText = `${title} ${prompt}`;
  const asksForSound = /\b(listen|hear|heard|played|audio|sound|ear)\b/i.test(
    listeningText
  );

  if (!asksForSound) return null;

  const interval = earTrainingIntervals.find((item) =>
    getSearchTerms(item).some((term) => includesMusicTerm(answer, term))
  );

  if (interval) {
    return {
      mode: "interval",
      rootNote: "C4",
      interval: interval.value,
      playback: "melodic",
    };
  }

  const chord = earTrainingChords.find((item) =>
    getSearchTerms(item).some((term) => includesMusicTerm(answer, term))
  );

  if (chord) {
    return {
      mode: "chord",
      rootNote: "C4",
      chord: chord.value,
      playback: "blocked",
    };
  }

  return null;
}
