import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  Clock3,
  GraduationCap,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import {
  type AcademyArticleCard,
  getAcademyIndexData,
  getReadingMinutes,
} from "@/lib/academy";

const siteUrl = "https://www.jncchorale.com";

export const metadata: Metadata = {
  title: "Music Academy",
  description:
    "Learn music theory, vocal training, choral leadership, worship music, instrumental training, and music history with the Jude Nnam Chorale Music Academy.",
  alternates: {
    canonical: "/academy",
  },
  keywords: [
    "Jude Nnam Music Academy",
    "music theory Nigeria",
    "vocal training",
    "choral leadership",
    "worship music training",
    "African choral music lessons",
  ],
  openGraph: {
    title: "JNC Music Academy",
    description:
      "Articles and learning resources for singers, instrumentalists, worship leaders, and choral musicians.",
    url: "/academy",
    type: "website",
    images: ["/logo.svg"],
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function excerpt(article: AcademyArticleCard, limit = 170) {
  const value = article.excerpt || article.body;
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit).trim()}...`;
}

function ArticleCard({
  article,
  featured = false,
}: {
  article: AcademyArticleCard;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/academy/${article.slug}`}
      className={
        featured
          ? "group grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] transition hover:border-amber-200/30 lg:grid-cols-[0.92fr_1.08fr]"
          : "group rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-0.5 hover:border-amber-200/28 hover:bg-white/[0.07]"
      }
    >
      <div
        className={
          featured
            ? "relative min-h-80 bg-black"
            : "relative mb-5 aspect-[16/10] overflow-hidden rounded-[1.15rem] bg-black"
        }
      >
        <Image
          src={article.coverImageUrl ?? "/logo.svg"}
          alt={article.title}
          fill
          sizes={featured ? "(max-width: 1024px) 100vw, 48vw" : "(max-width: 768px) 100vw, 33vw"}
          className={article.coverImageUrl ? "object-cover transition duration-500 group-hover:scale-[1.03]" : "object-contain p-12"}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))]" />
      </div>
      <div className={featured ? "p-6 md:p-8" : ""}>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/72">
          <span>{article.category.name}</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>{getReadingMinutes(article.body)} min read</span>
        </div>
        <h2
          className={
            featured
              ? "mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl"
              : "mt-3 line-clamp-2 text-xl font-semibold leading-tight text-white"
          }
        >
          {article.title}
        </h2>
        <p
          className={
            featured
              ? "mt-5 max-w-2xl text-base leading-8 text-white/68"
              : "mt-3 line-clamp-3 text-sm leading-7 text-white/62"
          }
        >
          {excerpt(article, featured ? 280 : 170)}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            Read article
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
          <span className="text-xs text-white/42">
            {formatDate(article.publishedAt ?? article.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function AcademyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const search =
    typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q.trim() : "";
  const category =
    typeof resolvedSearchParams?.category === "string"
      ? resolvedSearchParams.category.trim()
      : "";
  const { categories, articles, featured, trending } = await getAcademyIndexData({
    search,
    category,
  });

  const visibleArticles = featured
    ? articles.filter((article) => article.id !== featured.id)
    : articles;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "JNC Music Academy",
    description: metadata.description,
    url: `${siteUrl}/academy`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/academy/${article.slug}`,
        name: article.title,
      })),
    },
  };

  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#07111f_48%,#121007_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
              <GraduationCap className="h-3.5 w-3.5" />
              Music Academy
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Learn the craft behind the sound.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Articles for choristers, instrumentalists, worship leaders, and curious musicians
              growing in theory, technique, history, and leadership.
            </p>
            <form className="mt-8 grid max-w-2xl gap-3 rounded-[1.5rem] border border-white/10 bg-black/24 p-3 sm:grid-cols-[1fr_auto]">
              <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-white/42" />
                <input
                  name="q"
                  defaultValue={search}
                  placeholder="Search lessons, voice, theory..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/36"
                />
              </label>
              {category ? <input type="hidden" name="category" value={category} /> : null}
              <Button className="rounded-2xl bg-amber-200 px-6 py-6 text-black hover:bg-amber-100">
                Search
              </Button>
            </form>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_26px_80px_rgba(0,0,0,0.32)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
              <BookOpenText className="h-6 w-6" />
            </div>
            <p className="mt-5 text-sm uppercase tracking-[0.22em] text-white/45">
              Learning Library
            </p>
            <p className="mt-3 text-4xl font-semibold text-white">
              {articles.length}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Published academy article{articles.length === 1 ? "" : "s"} available now.
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Link
            href={search ? `/academy?q=${encodeURIComponent(search)}` : "/academy"}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              category
                ? "border-white/10 bg-white/[0.04] text-white/62 hover:bg-white/[0.08]"
                : "border-amber-200/30 bg-amber-200 text-black"
            }`}
          >
            All
          </Link>
          {categories.map((item) => {
            const href = `/academy?category=${item.slug}${
              search ? `&q=${encodeURIComponent(search)}` : ""
            }`;
            const active = category === item.slug;
            return (
              <Link
                key={item.slug}
                href={href}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-amber-200/30 bg-amber-200 text-black"
                    : "border-white/10 bg-white/[0.04] text-white/62 hover:bg-white/[0.08]"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        {featured ? (
          <div>
            <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/62">
              <Sparkles className="h-4 w-4" />
              Featured Article
            </div>
            <ArticleCard article={featured} featured />
          </div>
        ) : null}

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/42">
                  Browse Academy
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  Latest lessons
                </h2>
              </div>
              <p className="text-sm text-white/50">
                {search || category ? `${visibleArticles.length} matching result${visibleArticles.length === 1 ? "" : "s"}` : "Newest first"}
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {visibleArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {visibleArticles.length === 0 ? (
              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
                  <Search className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white">
                  No academy articles found.
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/62">
                  Try another search, choose a different category, or check back after the admin
                  team publishes new lessons.
                </p>
              </div>
            ) : null}
          </div>

          <aside className="h-fit rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/42">
              <TrendingUp className="h-4 w-4 text-amber-100" />
              Trending Articles
            </div>
            <div className="mt-5 grid gap-4">
              {trending.length > 0 ? (
                trending.map((article) => (
                  <Link
                    key={article.id}
                    href={`/academy/${article.slug}`}
                    className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/58">
                      {article.category.name}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-white">
                      {article.title}
                    </h3>
                    <p className="mt-2 flex items-center gap-2 text-xs text-white/42">
                      <Clock3 className="h-3.5 w-3.5" />
                      {getReadingMinutes(article.body)} min read
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm leading-7 text-white/58">
                  Mark articles as trending from the admin academy page to build this list.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
