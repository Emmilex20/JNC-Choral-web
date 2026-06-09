import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpenText, Clock3, Sparkles } from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { Badge } from "@/components/ui/badge";
import {
  type AcademyArticleCard,
  getAcademyArticleBySlug,
  getReadingMinutes,
} from "@/lib/academy";
import { academyKeywords, jncEntityKeywords, uniqueKeywords } from "@/lib/seo-keywords";
import RichArticleContent from "./article-content";

const siteUrl = "https://www.jncchorale.com";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function articleExcerpt(article: AcademyArticleCard, limit = 160) {
  const clean = (article.excerpt || article.body).replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit).trim()}...`;
}

function RelatedCard({ article }: { article: AcademyArticleCard }) {
  return (
    <Link
      href={`/academy/${article.slug}`}
      className="group rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-0.5 hover:border-amber-200/28 hover:bg-white/[0.07]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/62">
        {article.category.name}
      </p>
      <h3 className="mt-3 line-clamp-2 text-xl font-semibold leading-tight text-white">
        {article.title}
      </h3>
      <p className="mt-3 line-clamp-3 text-sm leading-7 text-white/62">
        {articleExcerpt(article)}
      </p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
        Continue learning
        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAcademyArticleBySlug(slug);

  if (!data) {
    return {
      title: "Academy Article",
    };
  }

  const { article } = data;
  const description = articleExcerpt(article, 170);
  const keywords = uniqueKeywords(jncEntityKeywords, academyKeywords, [
    article.title,
    article.category.name,
    ...article.tags,
  ]);

  return {
    title: article.title,
    description,
    alternates: {
      canonical: `/academy/${article.slug}`,
    },
    keywords,
    openGraph: {
      title: article.title,
      description,
      url: `/academy/${article.slug}`,
      type: "article",
      images: [article.coverImageUrl ?? "/logo.svg"],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [article.coverImageUrl ?? "/logo.svg"],
    },
  };
}

export default async function AcademyArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAcademyArticleBySlug(slug);

  if (!data) notFound();

  const { article, related } = data;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: articleExcerpt(article, 170),
    keywords: uniqueKeywords(academyKeywords, [
      article.category.name,
      ...article.tags,
    ]).join(", "),
    image: article.coverImageUrl ?? `${siteUrl}/logo.svg`,
    datePublished: article.publishedAt ?? article.createdAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: "Jude Nnam Chorale",
    },
    publisher: {
      "@type": "Organization",
      name: "Jude Nnam Chorale",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.svg`,
      },
    },
    mainEntityOfPage: `${siteUrl}/academy/${article.slug}`,
  };

  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#07111f_50%,#101007_100%)]">
          <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 lg:py-18">
            <Link
              href="/academy"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/62 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to academy
            </Link>
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1 text-amber-50 hover:bg-amber-200/10">
                {article.category.name}
              </Badge>
              {article.isTrending ? (
                <Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white/75 hover:bg-white/10">
                  Trending
                </Badge>
              ) : null}
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {article.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
              {articleExcerpt(article, 260)}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-white/52">
              <span className="inline-flex items-center gap-2">
                <BookOpenText className="h-4 w-4 text-amber-100" />
                JNC Music Academy
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-amber-100" />
                {getReadingMinutes(article.body)} min read
              </span>
              <span>{formatDate(article.publishedAt ?? article.createdAt)}</span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 md:px-6 lg:py-14">
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-[2rem] border border-white/10 bg-black">
            <Image
              src={article.coverImageUrl ?? "/logo.svg"}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 960px"
              className={article.coverImageUrl ? "object-cover" : "object-contain p-20"}
            />
          </div>

          <div>
            <RichArticleContent body={article.body} />
            {article.tags.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-black/24 px-3 py-1 text-xs font-semibold text-white/58"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </article>

      {related.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
          <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/62">
            <Sparkles className="h-4 w-4" />
            Related Articles
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <RelatedCard key={item.id} article={item} />
            ))}
          </div>
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}
