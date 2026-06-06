import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, RotateCcw, XCircle } from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { ShareActions } from "@/components/share-actions";
import { Button } from "@/components/ui/button";
import { getQuizAttemptForResults, parseOptions } from "@/lib/music-hub";

export const metadata: Metadata = {
  title: "Quiz Results",
  robots: {
    index: false,
    follow: false,
  },
};

type SavedAnswer = {
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
};

function parseSavedAnswers(value: unknown): SavedAnswer[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    if (!item || typeof item !== "object") {
      return { selectedIndex: null, correctIndex: -1, isCorrect: false };
    }

    const row = item as Record<string, unknown>;
    return {
      selectedIndex:
        typeof row.selectedIndex === "number" ? row.selectedIndex : null,
      correctIndex: typeof row.correctIndex === "number" ? row.correctIndex : -1,
      isCorrect: row.isCorrect === true,
    };
  });
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}s`;
  return `${minutes}m ${rest}s`;
}

export default async function QuizResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const attemptId =
    typeof resolvedSearchParams?.attemptId === "string"
      ? resolvedSearchParams.attemptId
      : "";
  if (!attemptId) notFound();

  const attempt = await getQuizAttemptForResults(attemptId);
  if (!attempt || attempt.quiz.slug !== slug) notFound();

  const answers = parseSavedAnswers(attempt.answers);
  const percent =
    attempt.totalQuestions > 0
      ? Math.round((attempt.score / attempt.totalQuestions) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#08111f_52%,#101007_100%)]">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 lg:py-18">
          <Link
            href={`/music-hub/quizzes/${attempt.quiz.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/62 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to quiz
          </Link>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-50">
            Quiz Results
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {attempt.quiz.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
            You scored {attempt.score} out of {attempt.totalQuestions}.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 md:px-6 lg:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
            <p className="text-sm text-white/58">Score</p>
            <p className="mt-3 text-5xl font-semibold text-white">{percent}%</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
            <p className="text-sm text-white/58">Correct answers</p>
            <p className="mt-3 text-5xl font-semibold text-white">
              {attempt.score}/{attempt.totalQuestions}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
            <p className="flex items-center gap-2 text-sm text-white/58">
              <Clock3 className="h-4 w-4 text-amber-100" />
              Completion time
            </p>
            <p className="mt-3 text-5xl font-semibold text-white">
              {formatDuration(attempt.completionTimeSeconds)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-amber-200/12 bg-amber-200/[0.065] p-5">
          <p className="text-sm font-semibold text-white">Share this quiz</p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Invite another chorister to try the same quiz.
          </p>
          <ShareActions
            className="mt-4"
            title={`JNC Quiz: ${attempt.quiz.title}`}
            text={`I scored ${attempt.score}/${attempt.totalQuestions} on ${attempt.quiz.title}. Try the quiz on JNC.`}
            path={`/music-hub/quizzes/${attempt.quiz.slug}`}
            shareLabel="Share quiz"
            copyLabel="Copy quiz link"
          />
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 md:p-8">
          <h2 className="text-2xl font-semibold text-white">Answer review</h2>
          <div className="mt-6 grid gap-5">
            {attempt.quiz.questions.map((question, index) => {
              const answer = answers[index];
              const options = parseOptions(question.options);
              const selected =
                answer?.selectedIndex !== null && answer?.selectedIndex !== undefined
                  ? options[answer.selectedIndex]
                  : "No answer";
              const correct = options[question.correctIndex] ?? "Correct answer";
              const wasCorrect = answer?.isCorrect === true;

              return (
                <div
                  key={question.prompt}
                  className="rounded-[1.5rem] border border-white/10 bg-black/24 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/42">
                        Question {index + 1}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold leading-7 text-white">
                        {question.prompt}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        wasCorrect
                          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                          : "border-red-300/20 bg-red-400/10 text-red-100"
                      }`}
                    >
                      {wasCorrect ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {wasCorrect ? "Correct" : "Review"}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm leading-6 text-white/64">
                    <p>
                      Your answer: <span className="font-semibold text-white">{selected}</span>
                    </p>
                    {!wasCorrect ? (
                      <p>
                        Correct answer: <span className="font-semibold text-white">{correct}</span>
                      </p>
                    ) : null}
                    {question.explanation ? (
                      <p className="rounded-2xl border border-amber-200/10 bg-amber-200/8 p-4 text-amber-50/82">
                        {question.explanation}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button className="rounded-2xl bg-amber-200 px-6 py-6 text-black hover:bg-amber-100" asChild>
            <Link href={`/music-hub/quizzes/${attempt.quiz.slug}`}>
              Try again
              <RotateCcw className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border-white/15 bg-white/[0.05] px-6 py-6 text-white hover:bg-white/[0.09]"
            asChild
          >
            <Link href="/music-hub/quizzes">More quizzes</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
