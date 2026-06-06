import {
  getSightReadingMeasureBeats,
  noteToMidi,
  type SightReadingExercise,
  type SightReadingNote,
} from "@/lib/sight-reading";

type SightReadingSheetProps = {
  exercise: SightReadingExercise;
  compact?: boolean;
};

const letterOrder = ["C", "D", "E", "F", "G", "A", "B"];

function diatonicStep(pitch: string) {
  const letter = pitch[0] ?? "C";
  const octave = Number(pitch.slice(1)) || 4;
  return octave * 7 + letterOrder.indexOf(letter);
}

function noteY(pitch: string, bottomLineY: number, lineGap: number) {
  const stepFromE4 = diatonicStep(pitch) - diatonicStep("E4");
  return bottomLineY - stepFromE4 * (lineGap / 2);
}

function splitSystems(notes: SightReadingNote[]) {
  const systemCount = notes.length > 20 ? 3 : 2;
  const perSystem = Math.ceil(notes.length / systemCount);
  return Array.from({ length: systemCount }, (_, index) =>
    notes.slice(index * perSystem, (index + 1) * perSystem)
  ).filter((system) => system.length > 0);
}

function durationLabel(beats: number) {
  if (beats === 0.5) return "1/2 beat";
  if (beats === 1) return "1 beat";
  return `${beats} beats`;
}

export function SightReadingSheet({ exercise, compact = false }: SightReadingSheetProps) {
  const systems = splitSystems(exercise.notes);
  const width = 1000;
  const systemHeight = compact ? 138 : 156;
  const topPadding = compact ? 28 : 40;
  const height = topPadding + systems.length * systemHeight + 26;
  const left = 96;
  const right = 955;
  const lineGap = 12;
  const measureBeats = getSightReadingMeasureBeats(exercise);

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035]">
      <div
        className={`flex flex-col gap-3 border-b border-white/10 px-4 py-4 ${
          compact ? "" : "sm:flex-row sm:items-center sm:justify-between"
        }`}
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/62">
            Sight-singing sheet
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{exercise.title}</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-white/66">
          <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1.5">
            {exercise.keySignature}
          </span>
          <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1.5">
            {exercise.timeSignature}
          </span>
          <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1.5">
            {exercise.tempoBpm} BPM
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${exercise.title} sight-singing staff`}
        className="h-auto w-full bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(0,0,0,0.12))]"
      >
        <rect width={width} height={height} fill="transparent" />
        {systems.map((notes, systemIndex) => {
          const topLine = topPadding + systemIndex * systemHeight;
          const bottomLine = topLine + lineGap * 4;
          const noteGap = (right - left) / Math.max(1, notes.length);
          let beatCursor = 0;

          return (
            <g key={systemIndex}>
              {[0, 1, 2, 3, 4].map((line) => (
                <line
                  key={line}
                  x1={left - 16}
                  x2={right}
                  y1={topLine + line * lineGap}
                  y2={topLine + line * lineGap}
                  stroke="rgba(255,255,255,0.42)"
                  strokeWidth="1.4"
                />
              ))}

              <text
                x="32"
                y={topLine + 41}
                fill="rgba(251,191,36,0.88)"
                fontSize="38"
                fontFamily="Georgia, serif"
              >
                G
              </text>

              {notes.map((note, noteIndex) => {
                const x = left + noteIndex * noteGap + noteGap * 0.44;
                const y = noteY(note.pitch, bottomLine, lineGap);
                const isHalfOrLonger = note.beats >= 2;
                const needsLedger = noteToMidi(note.pitch) <= noteToMidi("D4");
                const barline =
                  noteIndex > 0 && Math.abs(beatCursor % measureBeats) < 0.001;
                const currentBeat = beatCursor;
                beatCursor += note.beats;

                return (
                  <g key={`${note.pitch}-${noteIndex}`}>
                    {barline ? (
                      <line
                        x1={x - noteGap * 0.42}
                        x2={x - noteGap * 0.42}
                        y1={topLine}
                        y2={bottomLine}
                        stroke="rgba(251,191,36,0.38)"
                        strokeWidth="2"
                      />
                    ) : null}

                    {needsLedger ? (
                      <line
                        x1={x - 18}
                        x2={x + 18}
                        y1={bottomLine + lineGap}
                        y2={bottomLine + lineGap}
                        stroke="rgba(255,255,255,0.42)"
                        strokeWidth="1.4"
                      />
                    ) : null}

                    <ellipse
                      cx={x}
                      cy={y}
                      rx="13"
                      ry="8"
                      transform={`rotate(-18 ${x} ${y})`}
                      fill={isHalfOrLonger ? "rgba(2,4,10,0.92)" : "rgba(255,255,255,0.92)"}
                      stroke="rgba(255,255,255,0.92)"
                      strokeWidth="2.2"
                    />
                    <line
                      x1={x + 11}
                      x2={x + 11}
                      y1={y - 2}
                      y2={y - 54}
                      stroke="rgba(255,255,255,0.86)"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                    {note.beats === 0.5 ? (
                      <path
                        d={`M ${x + 11} ${y - 52} C ${x + 42} ${y - 40}, ${x + 34} ${y - 25}, ${x + 18} ${y - 18}`}
                        fill="none"
                        stroke="rgba(255,255,255,0.78)"
                        strokeWidth="2.3"
                        strokeLinecap="round"
                      />
                    ) : null}
                    <text
                      x={x}
                      y={bottomLine + 35}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.45)"
                      fontSize="13"
                    >
                      {durationLabel(note.beats)}
                    </text>
                    <text
                      x={x}
                      y={bottomLine + 55}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.36)"
                      fontSize="12"
                    >
                      b{Math.floor(currentBeat) + 1}
                    </text>
                  </g>
                );
              })}

              <line
                x1={right}
                x2={right}
                y1={topLine}
                y2={bottomLine}
                stroke="rgba(255,255,255,0.62)"
                strokeWidth="2.4"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
