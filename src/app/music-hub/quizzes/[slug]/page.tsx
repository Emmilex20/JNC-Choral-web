import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Brain, ListChecks, Trophy } from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { getQuizForPlay, parseOptions } from "@/lib/music-hub";
import QuizRunner from "../ui/quiz-runner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await getQuizForPlay(slug);

  if (!quiz) {
    return { title: "Music Quiz" };
  }

  return {
    title: quiz.title,
    description:
      quiz.description ??
      `Take the ${quiz.title} quiz from the JNC Music Quiz Center.`,
    alternates: {
      canonical: `/music-hub/quizzes/${quiz.slug}`,
    },
    openGraph: {
      title: quiz.title,
      description:
        quiz.description ??
        `Take the ${quiz.title} quiz from the JNC Music Quiz Center.`,
      url: `/music-hub/quizzes/${quiz.slug}`,
      images: ["/logo.svg"],
    },
  };
}

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = await getQuizForPlay(slug);

  if (!quiz || quiz.questions.length === 0) notFound();

  const questions = quiz.questions
    .map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: parseOptions(question.options),
    }))
    .filter((question) => question.options.length >= 2);

  if (questions.length === 0) notFound();

  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#08111f_52%,#101007_100%)]">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 lg:py-18">
          <Link
            href="/music-hub/quizzes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/62 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to quizzes
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-50">
              <Brain className="h-3.5 w-3.5" />
              {quiz.category}
            </span>
            {quiz.isPopular ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/72">
                <Trophy className="h-3.5 w-3.5" />
                Popular quiz
              </span>
            ) : null}
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {quiz.title}
          </h1>
          {quiz.description ? (
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              {quiz.description}
            </p>
          ) : null}
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-white/60">
            <ListChecks className="h-4 w-4 text-amber-100" />
            {questions.length} question{questions.length === 1 ? "" : "s"}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 md:px-6 lg:py-14">
        <QuizRunner
          quiz={{
            id: quiz.id,
            title: quiz.title,
            questions,
          }}
        />
      </section>

      <SiteFooter />
    </main>
  );
}
