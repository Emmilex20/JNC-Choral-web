import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Brain, Clock3, ListChecks, Music2, Trophy } from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { listPublishedQuizzes, quizCategories } from "@/lib/music-hub";

export const metadata: Metadata = {
  title: "Music Quiz Center",
  description:
    "Take JNC music quizzes on beginner music, choral knowledge, worship music, and instrumental knowledge.",
  alternates: {
    canonical: "/music-hub/quizzes",
  },
  openGraph: {
    title: "JNC Music Quiz Center",
    description:
      "Challenge your music knowledge with JNC quizzes for singers, instrumentalists, and worship musicians.",
    url: "/music-hub/quizzes",
    images: ["/logo.svg"],
  },
};

export default async function MusicQuizzesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const category =
    typeof resolvedSearchParams?.category === "string"
      ? resolvedSearchParams.category
      : "";
  const safeCategory = quizCategories.includes(category as (typeof quizCategories)[number])
    ? category
    : "";
  const quizzes = await listPublishedQuizzes(safeCategory || undefined);
  const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz._count.questions, 0);

  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#08111f_52%,#101007_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
              <Brain className="h-3.5 w-3.5" />
              Music Quiz Center
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Test your ear, theory, and choir instincts.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Short, focused quizzes for music beginners, choristers, worship teams, and
              instrumentalists building confidence one question at a time.
            </p>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
              <ListChecks className="h-6 w-6" />
            </div>
            <p className="mt-5 text-sm uppercase tracking-[0.22em] text-white/45">
              Quiz Library
            </p>
            <p className="mt-3 text-4xl font-semibold">{quizzes.length}</p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Published quiz{quizzes.length === 1 ? "" : "zes"} with {totalQuestions} total
              question{totalQuestions === 1 ? "" : "s"}.
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Link
            href="/music-hub/quizzes"
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              safeCategory
                ? "border-white/10 bg-white/[0.04] text-white/62 hover:bg-white/[0.08]"
                : "border-amber-200/30 bg-amber-200 text-black"
            }`}
          >
            All
          </Link>
          {quizCategories.map((item) => (
            <Link
              key={item}
              href={`/music-hub/quizzes?category=${encodeURIComponent(item)}`}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                safeCategory === item
                  ? "border-amber-200/30 bg-amber-200 text-black"
                  : "border-white/10 bg-white/[0.04] text-white/62 hover:bg-white/[0.08]"
              }`}
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/music-hub/quizzes/${quiz.slug}`}
              className="group rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-0.5 hover:border-amber-200/28 hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
                  <Music2 className="h-5 w-5" />
                </span>
                {quiz.isPopular ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-xs font-semibold text-amber-50">
                    <Trophy className="h-3.5 w-3.5" />
                    Popular
                  </span>
                ) : null}
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/62">
                {quiz.category}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-white">{quiz.title}</h2>
              {quiz.description ? (
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-white/62">
                  {quiz.description}
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-white/46">
                <span className="inline-flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5" />
                  {quiz._count.questions} questions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  Quick quiz
                </span>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                Start quiz
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        {quizzes.length === 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
              <Brain className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold">No quizzes published yet.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/62">
              Published quizzes from the admin academy workspace will appear here.
            </p>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}
