"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

type ChatCompletionResponse = {
  choices?: {
    message?: {
      content?: string | null;
    };
  }[];
  error?: {
    message?: string;
  };
};

const FeedbackSchema = z.object({
  summary: z.string().min(8).max(320),
  strengths: z.array(z.string().min(4).max(140)).min(1).max(3),
  improvements: z.array(z.string().min(4).max(160)).min(1).max(3),
  nextStep: z.string().min(8).max(180),
});

const NoteResultSchema = z.object({
  index: z.number().int().min(0).max(60),
  expectedPitch: z.string().min(2).max(4),
  sungPitch: z.string().min(2).max(4).nullable(),
  pitchErrorSemitones: z.number().min(-24).max(24).nullable(),
  coverage: z.number().min(0).max(1),
});

const SubmitSightReadingSchema = z.object({
  sourceType: z.enum(["daily-challenge", "challenge"]),
  sourceId: z.string().min(1),
  exerciseTitle: z.string().min(2).max(140),
  score: z.number().int().min(0).max(100),
  pitchScore: z.number().int().min(0).max(100),
  rhythmScore: z.number().int().min(0).max(100),
  stabilityScore: z.number().int().min(0).max(100),
  transpositionSemitones: z.number().min(-24).max(24),
  noteResults: z.array(NoteResultSchema).min(1).max(60),
});

type Feedback = z.infer<typeof FeedbackSchema>;
type SubmitSightReadingInput = z.infer<typeof SubmitSightReadingSchema>;

function parseJsonContent(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced?.[1] ?? trimmed) as unknown;
}

function fallbackFeedback(input: SubmitSightReadingInput): Feedback {
  const weakCoverage = input.noteResults.filter((note) => note.coverage < 0.5).length;
  const missedNotes = input.noteResults.filter((note) => note.sungPitch === null).length;

  return {
    summary:
      input.score >= 80
        ? "Strong attempt. Your relative pitch and beat alignment are already working together."
        : input.score >= 55
          ? "Good foundation. The main work is cleaner note placement and steadier timing."
          : "Keep going. This attempt gives you a clear starting point for pitch and rhythm practice.",
    strengths: [
      input.pitchScore >= input.rhythmScore
        ? "You held the melodic direction better than the beat alignment."
        : "Your beat coverage was stronger than the pitch accuracy.",
      `The performance was assessed without judging absolute key; your transposition was about ${input.transpositionSemitones.toFixed(1)} semitones.`,
    ],
    improvements: [
      missedNotes > 0
        ? `Aim to sing through every written note; ${missedNotes} note${missedNotes === 1 ? "" : "s"} did not register clearly.`
        : "Keep the tone stable through each note before moving to the next one.",
      weakCoverage > 0
        ? "Use the metronome count-in and stay with the pulse from note to note."
        : "Refine transitions so each pitch lands right at the beat.",
    ],
    nextStep:
      "Repeat it once slower, then at the written tempo, keeping the same starting pitch throughout.",
  };
}

async function generateFeedback(input: SubmitSightReadingInput): Promise<Feedback> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_CONTENT_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) return fallbackFeedback(input);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a warm but precise JNC sight-singing coach. Give feedback only from the supplied scoring metrics. Do not judge absolute key; users may transpose.",
        },
        {
          role: "user",
          content: `Return JSON with summary, strengths, improvements, nextStep.

Exercise: ${input.exerciseTitle}
Overall score: ${input.score}
Pitch score: ${input.pitchScore}
Rhythm score: ${input.rhythmScore}
Stability score: ${input.stabilityScore}
Transposition semitones, ignored for scoring: ${input.transpositionSemitones}
Note metrics: ${JSON.stringify(input.noteResults)}`,
        },
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as ChatCompletionResponse | null;
  if (!response.ok) return fallbackFeedback(input);

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return fallbackFeedback(input);

  const parsed = FeedbackSchema.safeParse(parseJsonContent(content));
  return parsed.success ? parsed.data : fallbackFeedback(input);
}

export async function submitSightReadingAttemptAction(input: unknown) {
  const parsed = SubmitSightReadingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid sight-singing result." };
  }

  const session = await getServerSession(authOptions);
  const feedback = await generateFeedback(parsed.data);

  if (session?.user?.id) {
    const source =
      parsed.data.sourceType === "daily-challenge"
        ? {
            dailyChallengeId: parsed.data.sourceId,
            challengeId: null,
          }
        : {
            dailyChallengeId: null,
            challengeId: parsed.data.sourceId,
          };

    await prisma.sightReadingAttempt.create({
      data: {
        userId: session.user.id,
        sourceType: parsed.data.sourceType,
        exerciseTitle: parsed.data.exerciseTitle,
        score: parsed.data.score,
        pitchScore: parsed.data.pitchScore,
        rhythmScore: parsed.data.rhythmScore,
        stabilityScore: parsed.data.stabilityScore,
        transpositionSemitones: parsed.data.transpositionSemitones,
        metrics: {
          noteResults: parsed.data.noteResults,
        } satisfies Prisma.InputJsonValue,
        feedback: feedback satisfies Prisma.InputJsonValue,
        ...source,
      },
    });

    revalidatePath("/profile");
    if (parsed.data.sourceType === "daily-challenge") {
      revalidatePath("/music-hub/daily-challenge");
    } else {
      revalidatePath("/music-hub/challenges");
    }
  }

  return {
    ok: true as const,
    saved: Boolean(session?.user?.id),
    feedback,
  };
}
