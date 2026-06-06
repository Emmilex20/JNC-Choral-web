"use server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { isAdminSession } from "@/lib/authz";
import { challengeTypes } from "@/lib/challenges";
import { quizCategories } from "@/lib/music-hub";

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

type GeneratedResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const ArticleDraftSchema = z.object({
  title: z.string().min(4).max(140),
  excerpt: z.string().min(40).max(260),
  body: z.string().min(350).max(9000),
  tags: z.array(z.string().min(2).max(32)).min(3).max(8),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function readOptions(record: Record<string, unknown>) {
  const raw = record.options ?? record.choices ?? record.answers;
  if (!Array.isArray(raw)) return undefined;
  const options = raw.filter((item): item is string => typeof item === "string").map((item) => item.trim());
  return options.length === 4 ? options : undefined;
}

function readCorrectIndex(record: Record<string, unknown>, options: string[]) {
  const direct =
    record.correctIndex ??
    record.correctAnswerIndex ??
    record.answerIndex ??
    record.correctOptionIndex;

  if (typeof direct === "number" && Number.isInteger(direct)) {
    return direct >= 0 && direct <= 3 ? direct : undefined;
  }

  if (typeof direct === "string") {
    const numeric = Number(direct);
    if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 3) return numeric;

    const letterIndex = "abcd".indexOf(direct.trim().toLowerCase());
    if (letterIndex >= 0) return letterIndex;
  }

  const answer = readString(record, ["correctAnswer", "answer", "correctOption"]);
  if (!answer) return undefined;

  const normalizedAnswer = answer.toLowerCase();
  const answerIndex = options.findIndex((option) => option.toLowerCase() === normalizedAnswer);
  return answerIndex >= 0 ? answerIndex : undefined;
}

function normalizeQuestionDraft(value: unknown) {
  if (!isRecord(value)) return value;

  const options = readOptions(value);
  const prompt = readString(value, ["prompt", "question", "text", "title"]);
  const explanation = readString(value, ["explanation", "rationale", "feedback", "note"]);

  if (!options || !prompt) return value;

  return {
    ...value,
    prompt,
    options,
    correctIndex: readCorrectIndex(value, options),
    explanation: explanation ?? "Review the correct option and connect it to the lesson.",
  };
}

const QuizQuestionDraftSchema = z.preprocess(normalizeQuestionDraft, z.object({
  prompt: z.string().min(8).max(500),
  options: z.array(z.string().min(1).max(180)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(10).max(500),
}));

const QuizDraftSchema = z.object({
  title: z.string().min(4).max(120),
  description: z.string().min(30).max(360),
  questions: z.array(QuizQuestionDraftSchema).min(5).max(10),
});

const DailyChallengeDraftSchema = z.preprocess(normalizeQuestionDraft, z.object({
  title: z.string().min(4).max(120),
  prompt: z.string().min(8).max(500),
  options: z.array(z.string().min(1).max(180)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(10).max(500),
}));

const MusicChallengeDraftSchema = z.object({
  title: z.string().min(4).max(140),
  description: z.string().min(40).max(700),
  prompt: z.string().min(40).max(900),
  rules: z.string().min(40).max(1400),
});

const TopicSchema = z.object({
  topic: z.string().trim().max(240).optional(),
});

const ArticleInputSchema = TopicSchema.extend({
  categoryName: z.string().min(2).max(80),
});

const QuizInputSchema = TopicSchema.extend({
  category: z.enum(quizCategories),
});

const DailyChallengeInputSchema = TopicSchema;

const MusicChallengeInputSchema = TopicSchema.extend({
  type: z.enum(challengeTypes),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return null;
  return session;
}

function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_CONTENT_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return { apiKey, model };
}

function parseJsonContent(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced?.[1] ?? trimmed) as unknown;
}

function normalizeTopic(topic: string | undefined, fallback: string) {
  const clean = topic?.trim();
  return clean ? clean : fallback;
}

function getAiError(error: unknown) {
  if (error instanceof z.ZodError) {
    return "OpenAI returned a draft in an unexpected shape. Please generate again.";
  }
  if (error instanceof Error) return error.message;
  return "Unable to generate AI draft.";
}

async function generateOpenAIJson<T>({
  schema,
  system,
  prompt,
}: {
  schema: { parse: (value: unknown) => T };
  system: string;
  prompt: string;
}): Promise<T> {
  const { apiKey, model } = getOpenAIConfig();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.72,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as ChatCompletionResponse | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "OpenAI request failed.");
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty draft.");

  return schema.parse(parseJsonContent(content));
}

async function adminGenerate<T>(
  generator: () => Promise<T>
): Promise<GeneratedResult<T>> {
  const session = await requireAdmin();
  if (!session) return { ok: false, error: "Unauthorized" };

  try {
    const data = await generator();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: getAiError(error) };
  }
}

export async function generateAcademyArticleDraftAction(input: unknown) {
  const parsed = ArticleInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid article prompt." };

  const categoryName = parsed.data.categoryName;
  const topic = normalizeTopic(parsed.data.topic, `a practical ${categoryName} lesson`);

  return adminGenerate(() =>
    generateOpenAIJson({
      schema: ArticleDraftSchema,
      system:
        "You are the editorial assistant for Jude Nnam Choral Platform. Write practical, original music education content for Nigerian choral, gospel, Catholic liturgical, and worship musicians. Return valid JSON only.",
      prompt: `Create a polished JNC Music Academy article draft.

Category: ${categoryName}
Topic or focus: ${topic}

Return JSON with:
- title: compelling but professional
- excerpt: 1-2 sentence SEO summary
- body: 700-950 words, rich but practical. Use short section headings, blank lines, bullet lists using "- ", at least one callout starting with "Tip:" or "Practice:", and **bold** emphasis where useful. No raw HTML.
- tags: 3-8 lowercase tags

Keep the tone premium, clear, warm, and useful for choristers.`,
    })
  );
}

export async function generateQuizDraftAction(input: unknown) {
  const parsed = QuizInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid quiz prompt." };

  const category = parsed.data.category;
  const topic = normalizeTopic(parsed.data.topic, `${category} fundamentals`);

  return adminGenerate(() =>
    generateOpenAIJson({
      schema: QuizDraftSchema,
      system:
        "You create accurate multiple-choice music education quizzes for Jude Nnam Choral Platform. Return valid JSON only.",
      prompt: `Create a JNC Music Hub quiz draft.

Category: ${category}
Topic or focus: ${topic}

Return JSON with:
- title
- description
- questions: exactly 8 multiple-choice questions. Each question object must use these exact keys: prompt, options, correctIndex, explanation.

Do not use the key "question"; use "prompt". Each question must have exactly 4 options, correctIndex from 0 to 3, and a short explanation. Keep questions practical for choristers, instrumentalists, and worship musicians.`,
    })
  );
}

export async function generateDailyChallengeDraftAction(input: unknown) {
  const parsed = DailyChallengeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid daily challenge prompt." };

  const topic = normalizeTopic(parsed.data.topic, "music theory listening and reading");

  return adminGenerate(() =>
    generateOpenAIJson({
      schema: DailyChallengeDraftSchema,
      system:
        "You create one-question daily music theory challenges for Jude Nnam Choral Platform. Return valid JSON only.",
      prompt: `Create one daily theory challenge.

Topic or focus: ${topic}

Return JSON with:
- title
- prompt. Use this exact key, not "question".
- options: exactly 4 options
- correctIndex from 0 to 3
- explanation

Make it quick, clear, and educational. Avoid trick wording.`,
    })
  );
}

export async function generateMusicChallengeDraftAction(input: unknown) {
  const parsed = MusicChallengeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid music challenge prompt." };

  const type = parsed.data.type;
  const topic = normalizeTopic(parsed.data.topic, `${type} for JNC community participation`);

  return adminGenerate(() =>
    generateOpenAIJson({
      schema: MusicChallengeDraftSchema,
      system:
        "You create public music challenge prompts for Jude Nnam Choral Platform. Return valid JSON only.",
      prompt: `Create a public JNC music challenge draft.

Challenge type: ${type}
Topic or focus: ${topic}

Return JSON with:
- title
- description: public summary
- prompt: what participants should submit
- rules: clear rules, eligibility, media guidance, voting note, and moderation note

Keep it inspiring, safe, practical, and suitable for audio, video, or text submissions.`,
    })
  );
}
