"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { submitQuizAttemptAction } from "../actions";

type PlayQuestion = {
  id: string;
  prompt: string;
  options: string[];
};

type QuizRunnerProps = {
  quiz: {
    id: string;
    title: string;
    questions: PlayQuestion[];
  };
};

export default function QuizRunner({ quiz }: QuizRunnerProps) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    quiz.questions.map(() => null)
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const question = quiz.questions[currentIndex];
  const answeredCount = answers.filter((answer) => answer !== null).length;
  const progress = useMemo(
    () => Math.round((answeredCount / quiz.questions.length) * 100),
    [answeredCount, quiz.questions.length]
  );

  function startQuiz() {
    setStarted(true);
    setStartedAt(Date.now());
    setError(null);
  }

  function selectAnswer(optionIndex: number) {
    setAnswers((prev) =>
      prev.map((answer, index) => (index === currentIndex ? optionIndex : answer))
    );
    setError(null);
  }

  function submit() {
    if (answers.some((answer) => answer === null)) {
      setError("Answer every question before submitting.");
      return;
    }

    startTransition(async () => {
      const completionTimeSeconds = Math.max(
        1,
        Math.round((Date.now() - (startedAt ?? Date.now())) / 1000)
      );
      const res = await submitQuizAttemptAction({
        quizId: quiz.id,
        answers,
        completionTimeSeconds,
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      router.push(res.resultsHref);
    });
  }

  if (!started) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 md:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-white">Ready to start?</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/62">
          You will answer {quiz.questions.length} question
          {quiz.questions.length === 1 ? "" : "s"}. Your result is saved when you submit.
        </p>
        <Button
          type="button"
          className="mt-6 rounded-2xl bg-amber-200 px-6 py-6 text-black hover:bg-amber-100"
          onClick={startQuiz}
        >
          Start quiz
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/62">
            Question {currentIndex + 1} of {quiz.questions.length}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{quiz.title}</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1.5 text-xs font-semibold text-white/60">
          {progress}% answered
        </span>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-amber-200 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-semibold leading-tight text-white">{question.prompt}</h3>
        <div className="mt-6 grid gap-3">
          {question.options.map((option, index) => {
            const selected = answers[currentIndex] === index;
            return (
              <button
                key={`${question.id}-${option}`}
                type="button"
                onClick={() => selectAnswer(index)}
                className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-amber-200/40 bg-amber-200 text-black"
                    : "border-white/10 bg-black/24 text-white hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                <span className="text-sm font-semibold">{option}</span>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    selected ? "border-black/20 bg-black/10" : "border-white/12 bg-white/5"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl border-white/15 bg-white/[0.05] text-white hover:bg-white/[0.09]"
          disabled={currentIndex === 0 || isPending}
          onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        {currentIndex === quiz.questions.length - 1 ? (
          <Button
            type="button"
            className="rounded-2xl bg-amber-200 px-6 py-6 text-black hover:bg-amber-100"
            disabled={isPending}
            onClick={submit}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit answers
          </Button>
        ) : (
          <Button
            type="button"
            className="rounded-2xl bg-amber-200 px-6 py-6 text-black hover:bg-amber-100"
            disabled={isPending}
            onClick={() =>
              setCurrentIndex((index) => Math.min(quiz.questions.length - 1, index + 1))
            }
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
