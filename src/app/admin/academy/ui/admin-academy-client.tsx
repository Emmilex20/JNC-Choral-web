"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowUpRight,
  BookOpenText,
  Brain,
  ImagePlus,
  Lightbulb,
  Loader2,
  Music2,
  Plus,
  Trash2,
  WandSparkles,
} from "lucide-react";

import { EarTrainingPlayer } from "@/components/ear-training-player";
import { SightReadingSheet } from "@/components/sight-reading-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  earTrainingChords,
  earTrainingIntervals,
  earTrainingRootNotes,
  getEarTrainingSoundLabel,
  normalizeEarTrainingSoundConfig,
  type EarTrainingChordId,
  type EarTrainingChordPlayback,
  type EarTrainingIntervalId,
  type EarTrainingIntervalPlayback,
  type EarTrainingRootNote,
  type EarTrainingSoundConfig,
} from "@/lib/ear-training";
import { getErrorMessage } from "@/lib/errors";
import {
  normalizeSightReadingExercise,
  type SightReadingExercise,
} from "@/lib/sight-reading";
import {
  createAcademyArticleAction,
  createAcademyCategoryAction,
  createDailyChallengeAction,
  createQuizAction,
  deleteAcademyArticleAction,
  deleteAcademyCategoryAction,
  deleteDailyChallengeAction,
  deleteQuizAction,
  updateAcademyArticleAction,
  updateDailyChallengeAction,
  updateQuizAction,
} from "../actions";
import {
  generateAcademyArticleDraftAction,
  generateDailyChallengeDraftAction,
  generateQuizDraftAction,
  generateSightReadingExerciseDraftAction,
} from "../../ai-actions";

const adminQuizCategories = [
  "Beginner Music",
  "Choral Knowledge",
  "Worship Music",
  "Instrumental Knowledge",
] as const;

type TabId = "articles" | "quizzes" | "daily";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  articleCount: number;
};

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  coverImagePublicId: string | null;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  isTrending: boolean;
  categoryId: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

type QuestionDraft = {
  id?: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
};

type QuizRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  isPublished: boolean;
  isPopular: boolean;
  attemptCount: number;
  createdAt: string;
  questions: QuestionDraft[];
};

type ChallengeRow = {
  id: string;
  challengeDate: string;
  title: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  soundConfig: EarTrainingSoundConfig | null;
  sightReadingExercise: SightReadingExercise | null;
  isPublished: boolean;
  attemptCount: number;
  createdAt: string;
};

type ArticleForm = {
  title: string;
  excerpt: string;
  body: string;
  categoryId: string;
  coverImageUrl: string;
  coverImagePublicId: string;
  tags: string;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  isTrending: boolean;
};

type QuizForm = {
  title: string;
  description: string;
  category: (typeof adminQuizCategories)[number];
  isPublished: boolean;
  isPopular: boolean;
  questions: QuestionDraft[];
};

type ChallengeForm = {
  challengeDate: string;
  title: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  soundConfig: EarTrainingSoundConfig | null;
  sightReadingExercise: SightReadingExercise | null;
  isPublished: boolean;
};

type SignatureResponse = {
  timestamp: number;
  signature: string;
  folder: string;
  cloudName: string;
  apiKey: string;
};

type CloudinaryImageUpload = {
  secure_url: string;
  public_id: string;
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25";
const labelClass = "text-xs font-medium text-white/70";

function emptyQuestion(): QuestionDraft {
  return {
    prompt: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  };
}

function normalizeFourOptions(options: string[]) {
  return [0, 1, 2, 3].map((index) => options[index] ?? "");
}

async function getSignature(folderSuffix: string) {
  const res = await fetch(
    `/api/admin/cloudinary-signature?folderSuffix=${encodeURIComponent(folderSuffix)}`
  );
  if (!res.ok) throw new Error("Failed to get upload signature");
  return (await res.json()) as SignatureResponse;
}

async function uploadCoverImage(file: File) {
  const sig = await getSignature("academy");
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  if (!up.ok) throw new Error("Cover image upload failed");
  return (await up.json()) as CloudinaryImageUpload;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminAcademyClient({
  todayDateKey,
  initialCategories,
  initialArticles,
  initialQuizzes,
  initialChallenges,
}: {
  todayDateKey: string;
  initialCategories: CategoryRow[];
  initialArticles: ArticleRow[];
  initialQuizzes: QuizRow[];
  initialChallenges: ChallengeRow[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("articles");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aiTask, setAiTask] = useState<"article" | "quiz" | "daily" | "sight-daily" | null>(null);
  const [categories] = useState<CategoryRow[]>(initialCategories);
  const [articles] = useState<ArticleRow[]>(initialArticles);
  const [quizzes] = useState<QuizRow[]>(initialQuizzes);
  const [challenges] = useState<ChallengeRow[]>(initialChallenges);

  const firstCategoryId = categories[0]?.id ?? "";
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleForm, setArticleForm] = useState<ArticleForm>({
    title: "",
    excerpt: "",
    body: "",
    categoryId: firstCategoryId,
    coverImageUrl: "",
    coverImagePublicId: "",
    tags: "",
    status: "DRAFT",
    isFeatured: false,
    isTrending: false,
  });
  const [articleAiPrompt, setArticleAiPrompt] = useState("");

  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizForm, setQuizForm] = useState<QuizForm>({
    title: "",
    description: "",
    category: adminQuizCategories[0],
    isPublished: false,
    isPopular: false,
    questions: [emptyQuestion()],
  });
  const [quizAiPrompt, setQuizAiPrompt] = useState("");

  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);
  const [challengeForm, setChallengeForm] = useState<ChallengeForm>({
    challengeDate: todayDateKey,
    title: "",
    prompt: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
    soundConfig: null,
    sightReadingExercise: null,
    isPublished: true,
  });
  const [dailyAiPrompt, setDailyAiPrompt] = useState("");

  function reloadOnSuccess(result: { ok: boolean; error?: string }) {
    if (!result.ok) {
      setError(result.error ?? "Unable to save");
      return;
    }
    window.location.reload();
  }

  function resetArticleForm() {
    setEditingArticleId(null);
    setArticleForm({
      title: "",
      excerpt: "",
      body: "",
      categoryId: firstCategoryId,
      coverImageUrl: "",
      coverImagePublicId: "",
      tags: "",
      status: "DRAFT",
      isFeatured: false,
      isTrending: false,
    });
  }

  function beginArticleEdit(article: ArticleRow) {
    setEditingArticleId(article.id);
    setActiveTab("articles");
    setArticleForm({
      title: article.title,
      excerpt: article.excerpt ?? "",
      body: article.body,
      categoryId: article.categoryId,
      coverImageUrl: article.coverImageUrl ?? "",
      coverImagePublicId: article.coverImagePublicId ?? "",
      tags: article.tags.join(", "),
      status: article.status,
      isFeatured: article.isFeatured,
      isTrending: article.isTrending,
    });
  }

  function submitArticle() {
    startTransition(async () => {
      const payload = {
        title: articleForm.title,
        excerpt: articleForm.excerpt,
        body: articleForm.body,
        categoryId: articleForm.categoryId,
        coverImageUrl: articleForm.coverImageUrl || undefined,
        coverImagePublicId: articleForm.coverImagePublicId || undefined,
        tags: articleForm.tags,
        status: articleForm.status,
        isFeatured: articleForm.isFeatured,
        isTrending: articleForm.isTrending,
      };
      const res = editingArticleId
        ? await updateAcademyArticleAction({ id: editingArticleId, ...payload })
        : await createAcademyArticleAction(payload);
      reloadOnSuccess(res);
    });
  }

  function submitCategory() {
    startTransition(async () => {
      const res = await createAcademyCategoryAction({
        name: categoryName,
        description: categoryDescription,
      });
      reloadOnSuccess(res);
    });
  }

  function removeCategory(category: CategoryRow) {
    if (!confirm(`Delete ${category.name}?`)) return;
    startTransition(async () => {
      const res = await deleteAcademyCategoryAction({ id: category.id });
      reloadOnSuccess(res);
    });
  }

  function removeArticle(article: ArticleRow) {
    if (!confirm(`Delete ${article.title}?`)) return;
    startTransition(async () => {
      const res = await deleteAcademyArticleAction({ id: article.id });
      reloadOnSuccess(res);
    });
  }

  function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const uploaded = await uploadCoverImage(file);
        setArticleForm((prev) => ({
          ...prev,
          coverImageUrl: uploaded.secure_url,
          coverImagePublicId: uploaded.public_id,
        }));
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err, "Unable to upload cover image"));
      } finally {
        e.target.value = "";
      }
    });
  }

  function generateArticleDraft() {
    const selectedCategory =
      categories.find((category) => category.id === articleForm.categoryId) ?? categories[0];

    setError(null);
    setAiTask("article");
    startTransition(async () => {
      const res = await generateAcademyArticleDraftAction({
        topic: articleAiPrompt,
        categoryName: selectedCategory?.name ?? "Music Theory",
      });

      if (!res.ok) {
        setError(res.error);
        setAiTask(null);
        return;
      }

      setArticleForm((prev) => ({
        ...prev,
        title: res.data.title,
        excerpt: res.data.excerpt,
        body: res.data.body,
        tags: res.data.tags.join(", "),
        status: "DRAFT",
      }));
      setAiTask(null);
    });
  }

  function resetQuizForm() {
    setEditingQuizId(null);
    setQuizForm({
      title: "",
      description: "",
      category: adminQuizCategories[0],
      isPublished: false,
      isPopular: false,
      questions: [emptyQuestion()],
    });
  }

  function beginQuizEdit(quiz: QuizRow) {
    setEditingQuizId(quiz.id);
    setActiveTab("quizzes");
    setQuizForm({
      title: quiz.title,
      description: quiz.description ?? "",
      category: adminQuizCategories.includes(quiz.category as (typeof adminQuizCategories)[number])
        ? (quiz.category as (typeof adminQuizCategories)[number])
        : adminQuizCategories[0],
      isPublished: quiz.isPublished,
      isPopular: quiz.isPopular,
      questions:
        quiz.questions.length > 0
          ? quiz.questions.map((question) => ({
              ...question,
              options: normalizeFourOptions(question.options),
              explanation: question.explanation ?? "",
            }))
          : [emptyQuestion()],
    });
  }

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question
      ),
    }));
  }

  function updateQuestionOption(questionIndex: number, optionIndex: number, value: string) {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, index) => {
        if (index !== questionIndex) return question;
        const options = normalizeFourOptions(question.options);
        options[optionIndex] = value;
        return { ...question, options };
      }),
    }));
  }

  function submitQuiz() {
    startTransition(async () => {
      const payload = {
        title: quizForm.title,
        description: quizForm.description,
        category: quizForm.category,
        isPublished: quizForm.isPublished,
        isPopular: quizForm.isPopular,
        questions: quizForm.questions.map((question) => ({
          prompt: question.prompt,
          options: normalizeFourOptions(question.options),
          correctIndex: question.correctIndex,
          explanation: question.explanation ?? "",
        })),
      };
      const res = editingQuizId
        ? await updateQuizAction({ id: editingQuizId, ...payload })
        : await createQuizAction(payload);
      reloadOnSuccess(res);
    });
  }

  function generateQuizDraft() {
    setError(null);
    setAiTask("quiz");
    startTransition(async () => {
      const res = await generateQuizDraftAction({
        topic: quizAiPrompt,
        category: quizForm.category,
      });

      if (!res.ok) {
        setError(res.error);
        setAiTask(null);
        return;
      }

      setQuizForm((prev) => ({
        ...prev,
        title: res.data.title,
        description: res.data.description,
        isPublished: false,
        questions: res.data.questions.map((question) => ({
          prompt: question.prompt,
          options: normalizeFourOptions(question.options),
          correctIndex: question.correctIndex,
          explanation: question.explanation,
        })),
      }));
      setAiTask(null);
    });
  }

  function removeQuiz(quiz: QuizRow) {
    if (!confirm(`Delete ${quiz.title}?`)) return;
    startTransition(async () => {
      const res = await deleteQuizAction({ id: quiz.id });
      reloadOnSuccess(res);
    });
  }

  function resetChallengeForm() {
    setEditingChallengeId(null);
    setChallengeForm({
      challengeDate: todayDateKey,
      title: "",
      prompt: "",
      options: ["", "", "", ""],
      correctIndex: 0,
      explanation: "",
      soundConfig: null,
      sightReadingExercise: null,
      isPublished: true,
    });
  }

  function beginChallengeEdit(challenge: ChallengeRow) {
    setEditingChallengeId(challenge.id);
    setActiveTab("daily");
    setChallengeForm({
      challengeDate: challenge.challengeDate,
      title: challenge.title,
      prompt: challenge.prompt,
      options: normalizeFourOptions(challenge.options),
      correctIndex: challenge.correctIndex,
      explanation: challenge.explanation ?? "",
      soundConfig: challenge.soundConfig,
      sightReadingExercise: challenge.sightReadingExercise,
      isPublished: challenge.isPublished,
    });
  }

  function updateChallengeOption(index: number, value: string) {
    setChallengeForm((prev) => {
      const options = normalizeFourOptions(prev.options);
      options[index] = value;
      return { ...prev, options };
    });
  }

  function setChallengeSoundMode(mode: "none" | "interval" | "chord") {
    setChallengeForm((prev) => {
      if (mode === "none") return { ...prev, soundConfig: null };

      const rootNote = prev.soundConfig?.rootNote ?? "C4";
      const soundConfig: EarTrainingSoundConfig =
        mode === "interval"
          ? {
              mode: "interval",
              rootNote,
              interval:
                prev.soundConfig?.mode === "interval"
                  ? prev.soundConfig.interval
                  : "major-third",
              playback:
                prev.soundConfig?.mode === "interval"
                  ? prev.soundConfig.playback
                  : "melodic",
            }
          : {
              mode: "chord",
              rootNote,
              chord:
                prev.soundConfig?.mode === "chord"
                  ? prev.soundConfig.chord
                  : "major-triad",
              playback:
                prev.soundConfig?.mode === "chord"
                  ? prev.soundConfig.playback
                  : "blocked",
            };

      return { ...prev, soundConfig };
    });
  }

  function updateSoundRootNote(rootNote: EarTrainingRootNote) {
    setChallengeForm((prev) =>
      prev.soundConfig
        ? { ...prev, soundConfig: { ...prev.soundConfig, rootNote } }
        : prev
    );
  }

  function updateIntervalSound(patch: {
    interval?: EarTrainingIntervalId;
    playback?: EarTrainingIntervalPlayback;
  }) {
    setChallengeForm((prev) =>
      prev.soundConfig?.mode === "interval"
        ? { ...prev, soundConfig: { ...prev.soundConfig, ...patch } }
        : prev
    );
  }

  function updateChordSound(patch: {
    chord?: EarTrainingChordId;
    playback?: EarTrainingChordPlayback;
  }) {
    setChallengeForm((prev) =>
      prev.soundConfig?.mode === "chord"
        ? { ...prev, soundConfig: { ...prev.soundConfig, ...patch } }
        : prev
    );
  }

  function submitChallenge() {
    startTransition(async () => {
      const payload = {
        ...challengeForm,
        options: normalizeFourOptions(challengeForm.options),
      };
      const res = editingChallengeId
        ? await updateDailyChallengeAction({ id: editingChallengeId, ...payload })
        : await createDailyChallengeAction(payload);
      reloadOnSuccess(res);
    });
  }

  function generateDailyChallengeDraft() {
    setError(null);
    setAiTask("daily");
    startTransition(async () => {
      const res = await generateDailyChallengeDraftAction({
        topic: dailyAiPrompt,
      });

      if (!res.ok) {
        setError(res.error);
        setAiTask(null);
        return;
      }

      setChallengeForm((prev) => ({
        ...prev,
        title: res.data.title,
        prompt: res.data.prompt,
        options: normalizeFourOptions(res.data.options),
        correctIndex: res.data.correctIndex,
        explanation: res.data.explanation,
        soundConfig: normalizeEarTrainingSoundConfig(res.data.soundConfig),
        sightReadingExercise: normalizeSightReadingExercise(res.data.sightReadingExercise),
        isPublished: false,
      }));
      setAiTask(null);
    });
  }

  function generateDailySightReadingExercise() {
    setError(null);
    setAiTask("sight-daily");
    startTransition(async () => {
      const res = await generateSightReadingExerciseDraftAction({
        topic: dailyAiPrompt || challengeForm.title || "daily sight-singing",
        source: "daily-challenge",
      });

      if (!res.ok) {
        setError(res.error);
        setAiTask(null);
        return;
      }

      setChallengeForm((prev) => ({
        ...prev,
        sightReadingExercise: normalizeSightReadingExercise(res.data),
      }));
      setAiTask(null);
    });
  }

  function removeChallenge(challenge: ChallengeRow) {
    if (!confirm(`Delete the challenge for ${challenge.challengeDate}?`)) return;
    startTransition(async () => {
      const res = await deleteDailyChallengeAction({ id: challenge.id });
      reloadOnSuccess(res);
    });
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-2">
        {[
          { id: "articles" as const, label: "Articles", icon: BookOpenText },
          { id: "quizzes" as const, label: "Quizzes", icon: Brain },
          { id: "daily" as const, label: "Daily Challenge", icon: Lightbulb },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-amber-200 text-black"
                  : "text-white/62 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "articles" ? (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <section className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                Article Desk
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {editingArticleId ? "Edit article" : "Create article"}
              </h2>

              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border border-amber-200/14 bg-amber-200/[0.055] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <WandSparkles className="h-4 w-4 text-amber-100" />
                    OpenAI draft assistant
                  </div>
                  <textarea
                    value={articleAiPrompt}
                    onChange={(e) => setArticleAiPrompt(e.target.value)}
                    rows={3}
                    className={`${inputClass} mt-3`}
                    placeholder="Example: blending, vowel matching, rehearsal discipline, sight-reading for beginners..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 rounded-2xl border-amber-200/25 bg-black/20 text-white hover:bg-white/10"
                    disabled={isPending || aiTask !== null}
                    onClick={generateArticleDraft}
                  >
                    {aiTask === "article" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <WandSparkles className="h-4 w-4" />
                    )}
                    {aiTask === "article" ? "Generating..." : "Generate article draft"}
                  </Button>
                </div>
                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    value={articleForm.title}
                    onChange={(e) =>
                      setArticleForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="e.g. Understanding Solfa in Choral Singing"
                  />
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    value={articleForm.categoryId}
                    onChange={(e) =>
                      setArticleForm((prev) => ({ ...prev, categoryId: e.target.value }))
                    }
                    className={inputClass}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Excerpt</label>
                  <textarea
                    value={articleForm.excerpt}
                    onChange={(e) =>
                      setArticleForm((prev) => ({ ...prev, excerpt: e.target.value }))
                    }
                    rows={3}
                    className={inputClass}
                    placeholder="Short summary for cards and SEO."
                  />
                </div>
                <div>
                  <label className={labelClass}>Article body</label>
                  <textarea
                    value={articleForm.body}
                    onChange={(e) =>
                      setArticleForm((prev) => ({ ...prev, body: e.target.value }))
                    }
                    rows={9}
                    className={inputClass}
                    placeholder="Write the full lesson. Use blank lines for paragraphs. Try ## Heading, - bullet points, > quotes, and **bold** emphasis."
                  />
                  <p className="mt-2 text-xs leading-5 text-white/45">
                    Formatting supported: short section titles, markdown headings, bullet lists,
                    numbered lists, quotes, callouts like Tip:, and **bold** or *italic* emphasis.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Tags</label>
                  <input
                    value={articleForm.tags}
                    onChange={(e) =>
                      setArticleForm((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="voice, harmony, rehearsal"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={articleForm.status}
                    onChange={(e) =>
                      setArticleForm((prev) => ({
                        ...prev,
                        status: e.target.value as ArticleForm["status"],
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/85">
                    <input
                      type="checkbox"
                      checked={articleForm.isFeatured}
                      onChange={(e) =>
                        setArticleForm((prev) => ({
                          ...prev,
                          isFeatured: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-white"
                    />
                    Featured
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/85">
                    <input
                      type="checkbox"
                      checked={articleForm.isTrending}
                      onChange={(e) =>
                        setArticleForm((prev) => ({
                          ...prev,
                          isTrending: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-white"
                    />
                    Trending
                  </label>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm font-semibold text-white hover:bg-white/[0.06]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onPickCover}
                      className="hidden"
                      disabled={isPending}
                    />
                    <ImagePlus className="h-4 w-4" />
                    Upload cover
                  </label>
                </div>
                {articleForm.coverImageUrl ? (
                  <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                    <Image
                      src={articleForm.coverImageUrl}
                      alt="Academy cover preview"
                      fill
                      sizes="420px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="rounded-2xl"
                    disabled={isPending || !articleForm.categoryId}
                    onClick={submitArticle}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {editingArticleId ? "Save article" : "Create article"}
                  </Button>
                  {editingArticleId ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                      disabled={isPending}
                      onClick={resetArticleForm}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                Categories
              </p>
              <div className="mt-4 grid gap-3">
                <input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className={inputClass}
                  placeholder="New category name"
                />
                <input
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  className={inputClass}
                  placeholder="Short description"
                />
                <Button
                  type="button"
                  className="rounded-2xl"
                  disabled={isPending || !categoryName.trim()}
                  onClick={submitCategory}
                >
                  <Plus className="h-4 w-4" />
                  Add category
                </Button>
              </div>
              <div className="mt-5 grid gap-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/24 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {category.name}
                      </p>
                      <p className="text-xs text-white/45">
                        {category.articleCount} article{category.articleCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      aria-label={`Delete ${category.name}`}
                      className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                      disabled={isPending || category.articleCount > 0}
                      onClick={() => removeCategory(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Article Library
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">All articles</h2>
              </div>
              <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                {articles.length} total
              </Badge>
            </div>
            <div className="mt-5 grid gap-3">
              {articles.map((article) => (
                <div key={article.id} className="rounded-[1.5rem] border border-white/10 bg-black/24 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                          {article.categoryName}
                        </Badge>
                        <Badge
                          className={
                            article.status === "PUBLISHED"
                              ? "rounded-full bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20"
                              : "rounded-full bg-amber-500/15 text-amber-100 hover:bg-amber-500/20"
                          }
                        >
                          {article.status === "PUBLISHED" ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-white">
                        {article.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/62">
                        {article.excerpt || article.body}
                      </p>
                      <p className="mt-2 text-xs text-white/42">
                        Updated {formatDate(article.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {article.status === "PUBLISHED" ? (
                        <Button
                          asChild
                          variant="outline"
                          className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                        >
                          <Link href={`/academy/${article.slug}`} target="_blank">
                            Open
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                        disabled={isPending}
                        onClick={() => beginArticleEdit(article)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                        disabled={isPending}
                        onClick={() => removeArticle(article)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {articles.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/60">
                  No academy articles yet.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "quizzes" ? (
        <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
          <section className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Quiz Builder</p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {editingQuizId ? "Edit quiz" : "Create quiz"}
            </h2>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-amber-200/14 bg-amber-200/[0.055] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <WandSparkles className="h-4 w-4 text-amber-100" />
                  OpenAI quiz assistant
                </div>
                <textarea
                  value={quizAiPrompt}
                  onChange={(e) => setQuizAiPrompt(e.target.value)}
                  rows={3}
                  className={`${inputClass} mt-3`}
                  placeholder="Example: beginner solfa, time signatures, choral blend, worship music history..."
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 rounded-2xl border-amber-200/25 bg-black/20 text-white hover:bg-white/10"
                  disabled={isPending || aiTask !== null}
                  onClick={generateQuizDraft}
                >
                  {aiTask === "quiz" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <WandSparkles className="h-4 w-4" />
                  )}
                  {aiTask === "quiz" ? "Generating..." : "Generate quiz draft"}
                </Button>
              </div>
              <input
                value={quizForm.title}
                onChange={(e) => setQuizForm((prev) => ({ ...prev, title: e.target.value }))}
                className={inputClass}
                placeholder="Quiz title"
              />
              <select
                value={quizForm.category}
                onChange={(e) =>
                  setQuizForm((prev) => ({
                    ...prev,
                    category: e.target.value as QuizForm["category"],
                  }))
                }
                className={inputClass}
              >
                {adminQuizCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <textarea
                value={quizForm.description}
                onChange={(e) =>
                  setQuizForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                className={inputClass}
                placeholder="Short quiz description"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/85">
                  <input
                    type="checkbox"
                    checked={quizForm.isPublished}
                    onChange={(e) =>
                      setQuizForm((prev) => ({ ...prev, isPublished: e.target.checked }))
                    }
                    className="h-4 w-4 accent-white"
                  />
                  Published
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/85">
                  <input
                    type="checkbox"
                    checked={quizForm.isPopular}
                    onChange={(e) =>
                      setQuizForm((prev) => ({ ...prev, isPopular: e.target.checked }))
                    }
                    className="h-4 w-4 accent-white"
                  />
                  Popular
                </label>
              </div>

              <div className="grid gap-4">
                {quizForm.questions.map((question, questionIndex) => (
                  <div
                    key={questionIndex}
                    className="rounded-2xl border border-white/10 bg-black/24 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">
                        Question {questionIndex + 1}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        aria-label={`Remove question ${questionIndex + 1}`}
                        className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                        disabled={quizForm.questions.length === 1}
                        onClick={() =>
                          setQuizForm((prev) => ({
                            ...prev,
                            questions: prev.questions.filter((_, index) => index !== questionIndex),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <textarea
                      value={question.prompt}
                      onChange={(e) =>
                        updateQuestion(questionIndex, { prompt: e.target.value })
                      }
                      rows={3}
                      className={`${inputClass} mt-3`}
                      placeholder="Question prompt"
                    />
                    <div className="mt-3 grid gap-2">
                      {normalizeFourOptions(question.options).map((option, optionIndex) => (
                        <div key={optionIndex} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                          <input
                            value={option}
                            onChange={(e) =>
                              updateQuestionOption(questionIndex, optionIndex, e.target.value)
                            }
                            className={inputClass}
                            placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                          />
                          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-xs text-white/75">
                            <input
                              type="radio"
                              name={`correct-${questionIndex}`}
                              checked={question.correctIndex === optionIndex}
                              onChange={() =>
                                updateQuestion(questionIndex, { correctIndex: optionIndex })
                              }
                              className="h-4 w-4 accent-white"
                            />
                            Correct
                          </label>
                        </div>
                      ))}
                    </div>
                    <textarea
                      value={question.explanation ?? ""}
                      onChange={(e) =>
                        updateQuestion(questionIndex, { explanation: e.target.value })
                      }
                      rows={2}
                      className={`${inputClass} mt-3`}
                      placeholder="Explanation after results"
                    />
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() =>
                  setQuizForm((prev) => ({
                    ...prev,
                    questions: [...prev.questions, emptyQuestion()],
                  }))
                }
              >
                <Plus className="h-4 w-4" />
                Add question
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="rounded-2xl"
                  disabled={isPending}
                  onClick={submitQuiz}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingQuizId ? "Save quiz" : "Create quiz"}
                </Button>
                {editingQuizId ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    disabled={isPending}
                    onClick={resetQuizForm}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Quiz Library
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">All quizzes</h2>
              </div>
              <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                {quizzes.length} total
              </Badge>
            </div>
            <div className="mt-5 grid gap-3">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="rounded-[1.5rem] border border-white/10 bg-black/24 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                          {quiz.category}
                        </Badge>
                        <Badge
                          className={
                            quiz.isPublished
                              ? "rounded-full bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20"
                              : "rounded-full bg-amber-500/15 text-amber-100 hover:bg-amber-500/20"
                          }
                        >
                          {quiz.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-white">{quiz.title}</h3>
                      <p className="mt-2 text-sm text-white/58">
                        {quiz.questions.length} questions / {quiz.attemptCount} attempts
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {quiz.isPublished ? (
                        <Button
                          asChild
                          variant="outline"
                          className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                        >
                          <Link href={`/music-hub/quizzes/${quiz.slug}`} target="_blank">
                            Open
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                        disabled={isPending}
                        onClick={() => beginQuizEdit(quiz)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                        disabled={isPending}
                        onClick={() => removeQuiz(quiz)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {quizzes.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/60">
                  No quizzes yet.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "daily" ? (
        <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
          <section className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Daily Challenge
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {editingChallengeId ? "Edit challenge" : "Create or update challenge"}
            </h2>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-amber-200/14 bg-amber-200/[0.055] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <WandSparkles className="h-4 w-4 text-amber-100" />
                  OpenAI daily challenge assistant
                </div>
                <textarea
                  value={dailyAiPrompt}
                  onChange={(e) => setDailyAiPrompt(e.target.value)}
                  rows={3}
                  className={`${inputClass} mt-3`}
                  placeholder="Example: intervals, key signatures, rhythm counting, diction, listening skills..."
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 rounded-2xl border-amber-200/25 bg-black/20 text-white hover:bg-white/10"
                  disabled={isPending || aiTask !== null}
                  onClick={generateDailyChallengeDraft}
                >
                  {aiTask === "daily" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <WandSparkles className="h-4 w-4" />
                  )}
                  {aiTask === "daily" ? "Generating..." : "Generate daily challenge"}
                </Button>
              </div>
              <input
                type="date"
                value={challengeForm.challengeDate}
                onChange={(e) =>
                  setChallengeForm((prev) => ({ ...prev, challengeDate: e.target.value }))
                }
                className={inputClass}
              />
              <input
                value={challengeForm.title}
                onChange={(e) =>
                  setChallengeForm((prev) => ({ ...prev, title: e.target.value }))
                }
                className={inputClass}
                placeholder="Challenge title"
              />
              <textarea
                value={challengeForm.prompt}
                onChange={(e) =>
                  setChallengeForm((prev) => ({ ...prev, prompt: e.target.value }))
                }
                rows={4}
                className={inputClass}
                placeholder="Multiple-choice prompt"
              />
              <div className="rounded-2xl border border-amber-200/14 bg-amber-200/[0.045] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-200/16 bg-black/30 text-amber-100">
                    <Music2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Generated listening sound
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/58">
                      No upload needed. Choose an interval or chord and the public challenge will
                      play it in the browser.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div>
                    <label className={labelClass}>Sound type</label>
                    <select
                      value={challengeForm.soundConfig?.mode ?? "none"}
                      onChange={(e) =>
                        setChallengeSoundMode(
                          e.target.value as "none" | "interval" | "chord"
                        )
                      }
                      className={inputClass}
                    >
                      <option value="none">No generated sound</option>
                      <option value="interval">Interval</option>
                      <option value="chord">Chord</option>
                    </select>
                  </div>

                  {challengeForm.soundConfig ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>Root note</label>
                          <select
                            value={challengeForm.soundConfig.rootNote}
                            onChange={(e) =>
                              updateSoundRootNote(e.target.value as EarTrainingRootNote)
                            }
                            className={inputClass}
                          >
                            {earTrainingRootNotes.map((note) => (
                              <option key={note.value} value={note.value}>
                                {note.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {challengeForm.soundConfig.mode === "interval" ? (
                          <div>
                            <label className={labelClass}>Interval</label>
                            <select
                              value={challengeForm.soundConfig.interval}
                              onChange={(e) =>
                                updateIntervalSound({
                                  interval: e.target.value as EarTrainingIntervalId,
                                })
                              }
                              className={inputClass}
                            >
                              {earTrainingIntervals.map((interval) => (
                                <option key={interval.value} value={interval.value}>
                                  {interval.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className={labelClass}>Chord</label>
                            <select
                              value={challengeForm.soundConfig.chord}
                              onChange={(e) =>
                                updateChordSound({
                                  chord: e.target.value as EarTrainingChordId,
                                })
                              }
                              className={inputClass}
                            >
                              {earTrainingChords.map((chord) => (
                                <option key={chord.value} value={chord.value}>
                                  {chord.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className={labelClass}>Playback</label>
                        {challengeForm.soundConfig.mode === "interval" ? (
                          <select
                            value={challengeForm.soundConfig.playback}
                            onChange={(e) =>
                              updateIntervalSound({
                                playback: e.target.value as EarTrainingIntervalPlayback,
                              })
                            }
                            className={inputClass}
                          >
                            <option value="melodic">Melodic</option>
                            <option value="harmonic">Harmonic</option>
                          </select>
                        ) : (
                          <select
                            value={challengeForm.soundConfig.playback}
                            onChange={(e) =>
                              updateChordSound({
                                playback: e.target.value as EarTrainingChordPlayback,
                              })
                            }
                            className={inputClass}
                          >
                            <option value="blocked">Blocked</option>
                            <option value="broken">Broken / arpeggiated</option>
                          </select>
                        )}
                      </div>

                      <EarTrainingPlayer
                        config={challengeForm.soundConfig}
                        compact
                        title="Preview generated sound"
                        description={getEarTrainingSoundLabel(challengeForm.soundConfig)}
                      />
                    </>
                  ) : null}
                </div>
              </div>
              <div className="rounded-2xl border border-cyan-200/14 bg-cyan-200/[0.045] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/16 bg-black/30 text-cyan-100">
                      <Music2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        AI sight-singing sheet
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/58">
                        Generate a 2-3 line sheet for users to sing. The checker ignores
                        absolute key and scores relative pitch plus beat coverage.
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-cyan-200/25 bg-black/20 text-white hover:bg-white/10"
                      disabled={isPending || aiTask !== null}
                      onClick={generateDailySightReadingExercise}
                    >
                      {aiTask === "sight-daily" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <WandSparkles className="h-4 w-4" />
                      )}
                      {aiTask === "sight-daily" ? "Generating..." : "Generate sheet"}
                    </Button>
                    {challengeForm.sightReadingExercise ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                        disabled={isPending}
                        onClick={() =>
                          setChallengeForm((prev) => ({
                            ...prev,
                            sightReadingExercise: null,
                          }))
                        }
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>

                {challengeForm.sightReadingExercise ? (
                  <div className="mt-4">
                    <SightReadingSheet exercise={challengeForm.sightReadingExercise} compact />
                  </div>
                ) : null}
              </div>
              <div className="grid gap-2">
                {normalizeFourOptions(challengeForm.options).map((option, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      value={option}
                      onChange={(e) => updateChallengeOption(index, e.target.value)}
                      className={inputClass}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                    <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-xs text-white/75">
                      <input
                        type="radio"
                        name="challenge-correct"
                        checked={challengeForm.correctIndex === index}
                        onChange={() =>
                          setChallengeForm((prev) => ({ ...prev, correctIndex: index }))
                        }
                        className="h-4 w-4 accent-white"
                      />
                      Correct
                    </label>
                  </div>
                ))}
              </div>
              <textarea
                value={challengeForm.explanation}
                onChange={(e) =>
                  setChallengeForm((prev) => ({ ...prev, explanation: e.target.value }))
                }
                rows={3}
                className={inputClass}
                placeholder="Explanation after answer"
              />
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/85">
                <input
                  type="checkbox"
                  checked={challengeForm.isPublished}
                  onChange={(e) =>
                    setChallengeForm((prev) => ({
                      ...prev,
                      isPublished: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-white"
                />
                Published
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="rounded-2xl"
                  disabled={isPending}
                  onClick={submitChallenge}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingChallengeId ? "Save challenge" : "Save challenge"}
                </Button>
                {editingChallengeId ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    disabled={isPending}
                    onClick={resetChallengeForm}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Challenge Calendar
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">All challenges</h2>
              </div>
              <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                {challenges.length} total
              </Badge>
            </div>
            <div className="mt-5 grid gap-3">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="rounded-[1.5rem] border border-white/10 bg-black/24 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                          {challenge.challengeDate}
                        </Badge>
                        <Badge
                          className={
                            challenge.isPublished
                              ? "rounded-full bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20"
                              : "rounded-full bg-amber-500/15 text-amber-100 hover:bg-amber-500/20"
                          }
                        >
                          {challenge.isPublished ? "Published" : "Draft"}
                        </Badge>
                        {challenge.soundConfig ? (
                          <Badge className="rounded-full bg-amber-500/15 text-amber-100 hover:bg-amber-500/20">
                            {getEarTrainingSoundLabel(challenge.soundConfig)}
                          </Badge>
                        ) : null}
                        {challenge.sightReadingExercise ? (
                          <Badge className="rounded-full bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/20">
                            Sight sheet
                          </Badge>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-white">
                        {challenge.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/62">
                        {challenge.prompt}
                      </p>
                      <p className="mt-2 text-sm text-white/45">
                        {challenge.attemptCount} attempt{challenge.attemptCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                        disabled={isPending}
                        onClick={() => beginChallengeEdit(challenge)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                        disabled={isPending}
                        onClick={() => removeChallenge(challenge)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {challenges.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/60">
                  No daily challenges yet.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
