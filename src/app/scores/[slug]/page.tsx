import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, Download, FileText, Lock } from "lucide-react";

import { authOptions } from "@/auth";
import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { findPublicScoreSheetBySlug } from "@/lib/music-sheets";
import { jncEntityKeywords, scoreKeywords, songKeywords, uniqueKeywords } from "@/lib/seo-keywords";

type ScorePageProps = {
  params: Promise<{ slug: string }>;
};

function scoreTitle(score: { title: string | null; fileName: string }) {
  return score.title ?? score.fileName;
}

function scoreDescription(score: {
  title: string | null;
  fileName: string;
  composer: string;
  description: string | null;
  voicing: string | null;
  lyricsLanguage: string | null;
}) {
  if (score.description) return score.description;

  const title = scoreTitle(score);
  const details = [score.voicing, score.lyricsLanguage].filter(Boolean).join(", ");
  return `${title} sheet music by ${score.composer}${details ? ` for ${details}` : ""}. View score details and register to download from the JNC Scores Bank.`;
}

export async function generateMetadata({ params }: ScorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const score = await findPublicScoreSheetBySlug(slug);

  if (!score) {
    return {
      title: "Score Not Found",
    };
  }

  const title = `${scoreTitle(score)} Score by ${score.composer}`;
  const description = scoreDescription(score);
  const scoreKeywordsForPage = uniqueKeywords(jncEntityKeywords, scoreKeywords, songKeywords, [
    scoreTitle(score),
    `${scoreTitle(score)} score`,
    `${scoreTitle(score)} sheet music`,
    `${scoreTitle(score)} by ${score.composer}`,
    score.composer,
    score.voicing,
    score.lyricsLanguage,
  ]);

  return {
    title,
    description,
    alternates: {
      canonical: `/scores/${score.slug}`,
    },
    keywords: scoreKeywordsForPage,
    openGraph: {
      title,
      description,
      url: `/scores/${score.slug}`,
      type: "article",
      images: ["/logo.svg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logo.svg"],
    },
  };
}

export default async function ScorePage({ params }: ScorePageProps) {
  const { slug } = await params;
  const [score, session] = await Promise.all([
    findPublicScoreSheetBySlug(slug),
    getServerSession(authOptions),
  ]);

  if (!score) notFound();

  const title = scoreTitle(score);
  const description = scoreDescription(score);
  const isSignedIn = Boolean(session?.user?.id);
  const downloadUrl = `/api/music-sheets/${score.id}/download`;
  const scorePath = `/scores/${score.slug}`;
  const scoreKeywordsForPage = uniqueKeywords(jncEntityKeywords, scoreKeywords, songKeywords, [
    title,
    `${title} score`,
    `${title} sheet music`,
    `${title} by ${score.composer}`,
    score.composer,
    score.voicing,
    score.lyricsLanguage,
  ]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    description,
    creator: {
      "@type": "Person",
      name: score.composer,
    },
    publisher: {
      "@type": "Organization",
      name: "Jude Nnam Chorale",
    },
    inLanguage: score.lyricsLanguage ?? undefined,
    genre: "Choral score",
    keywords: uniqueKeywords(scoreKeywordsForPage).join(", "),
    url: `https://www.jncchorale.com${scorePath}`,
    datePublished: score.createdAt.toISOString(),
    dateModified: score.updatedAt.toISOString(),
    isAccessibleForFree: true,
  };

  return (
    <main className="min-h-screen bg-[#02040a]">
      <SiteNavbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 lg:py-16">
        <Link
          href="/scores"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/76 transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Scores Bank
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
                <FileText className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/66">
                  Sir Jude Nnam Score
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {title}
                </h1>
                <p className="mt-3 text-lg text-white/66">{score.composer}</p>
              </div>
            </div>

            <p className="mt-8 text-base leading-8 text-white/72">{description}</p>

            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/42">
                  Composer
                </dt>
                <dd className="mt-2 text-sm font-semibold text-white">{score.composer}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/42">
                  Voicing
                </dt>
                <dd className="mt-2 text-sm font-semibold text-white">
                  {score.voicing ?? "Not specified"}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/42">
                  Language
                </dt>
                <dd className="mt-2 text-sm font-semibold text-white">
                  {score.lyricsLanguage ?? "Not specified"}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/42">
                  Key
                </dt>
                <dd className="mt-2 text-sm font-semibold text-white">
                  {score.scoreKey ?? "Not specified"}
                </dd>
              </div>
            </dl>
          </article>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/44">
              Download Access
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Score file</h2>
            <p className="mt-2 break-all text-sm leading-6 text-white/62">{score.fileName}</p>

            {isSignedIn ? (
              <a
                href={downloadUrl}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-200/30 bg-amber-200 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-100"
              >
                <Download className="h-4 w-4" />
                Download Score File
              </a>
            ) : (
              <div className="mt-6 rounded-2xl border border-amber-200/20 bg-amber-200/8 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-50">
                  <Lock className="h-4 w-4" />
                  Registration required
                </div>
                <p className="mt-2 text-sm leading-6 text-amber-50/78">
                  You can view this public score page now. Create an account or sign in to download the file.
                </p>
                <div className="mt-4 grid gap-2">
                  <Link
                    href={`/auth/register?callbackUrl=${encodeURIComponent(scorePath)}`}
                    className="inline-flex items-center justify-center rounded-full border border-amber-200/25 bg-amber-200 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-100"
                  >
                    Create Account to Download
                  </Link>
                  <Link
                    href={`/auth/login?callbackUrl=${encodeURIComponent(scorePath)}`}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-black/24 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Member Sign In
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-2 text-xs text-white/50">
              <p>Published {new Date(score.createdAt).toLocaleDateString()}</p>
              <p>Updated {new Date(score.updatedAt).toLocaleDateString()}</p>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
