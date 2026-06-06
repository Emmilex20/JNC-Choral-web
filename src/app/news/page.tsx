import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  FileText,
  Newspaper,
  Sparkles,
} from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { prisma } from "@/lib/prisma";

const siteUrl = "https://www.jnc-choral.vercel.app";

type NewsPost = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export const metadata: Metadata = {
  title: "News and Updates",
  description:
    "Read official JNC news, announcements, choir updates, auditions, events, media releases, and public notices from Jude Nnam Choral.",
  alternates: {
    canonical: "/news",
  },
  keywords: [
    "Jude Nnam Choral news",
    "JNC announcements",
    "Sir Jude Nnam choir updates",
    "JNC auditions news",
    "Nigerian gospel choir news",
  ],
  openGraph: {
    title: "News and Updates",
    description:
      "Official JNC news, announcements, choir updates, auditions, events, and public notices.",
    url: "/news",
    type: "website",
    images: ["/logo.svg"],
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function excerpt(value: string, limit = 180) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit).trim()}...`;
}

function readingMinutes(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

function categoryLabel(index: number) {
  const labels = ["Choir Update", "Public Notice", "JNC Dispatch", "Community"];
  return labels[index % labels.length];
}

function NewsCard({ post, index }: { post: NewsPost; index: number }) {
  return (
    <Link
      href={`/news/${post.id}`}
      className="group rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-200/28 hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/28 px-3 py-1.5 text-xs font-semibold text-white/58">
          <CalendarDays className="h-3.5 w-3.5 text-amber-100" />
          {formatShortDate(post.createdAt)}
        </span>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100 transition group-hover:bg-amber-200 group-hover:text-black">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/64">
        {categoryLabel(index)}
      </p>
      <h2 className="mt-3 line-clamp-2 text-xl font-semibold leading-tight text-white">
        {post.title}
      </h2>
      <p className="mt-3 line-clamp-3 text-sm leading-7 text-white/62">
        {excerpt(post.body, 210)}
      </p>
      <div className="mt-5 flex items-center gap-2 text-xs font-medium text-white/45">
        <Clock3 className="h-3.5 w-3.5" />
        {readingMinutes(post.body)} min read
      </div>
    </Link>
  );
}

export default async function NewsPage() {
  const announcements = await prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      updatedAt: true,
    },
    take: 60,
  });

  const [featured, ...rest] = announcements;
  const latestThree = announcements.slice(0, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Jude Nnam Choral News",
    description: metadata.description,
    url: `${siteUrl}/news`,
    isPartOf: {
      "@type": "WebSite",
      name: "Jude Nnam Choral",
      url: siteUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: announcements.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/news/${post.id}`,
        name: post.title,
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

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#07111f_50%,#101007_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
              <Newspaper className="h-3.5 w-3.5" />
              JNC Newsroom
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Official updates from the choir in motion.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Announcements, rehearsal notes, event releases, audition updates, and platform news
              from Jude Nnam Choral.
            </p>
          </div>

          <aside className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-[1.5rem] border border-amber-200/20 bg-black/36">
              <Image src="/logo.svg" alt="JNC logo" fill sizes="96px" className="object-cover" />
            </div>
            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/26 p-4">
                <p className="text-sm text-white/58">Published stories</p>
                <p className="mt-2 text-4xl font-semibold text-white">{announcements.length}</p>
              </div>
              <div className="rounded-2xl border border-amber-200/15 bg-amber-200/8 p-4 text-sm leading-6 text-amber-50/84">
                <Sparkles className="mb-3 h-4 w-4" />
                Follow JNC updates from auditions, concerts, rehearsals, media releases, and
                community moments.
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:py-16">
        {featured ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Link
              href={`/news/${featured.id}`}
              className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.035))] p-6 transition hover:border-amber-200/30 md:p-8"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#f8e08e,#67e8f9,#86efac)]" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/70">
                  <span>Featured Update</span>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span>{formatDate(featured.createdAt)}</span>
                </div>
                <h2 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
                  {featured.title}
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/70">
                  {excerpt(featured.body, 320)}
                </p>
                <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200 px-5 py-3 text-sm font-semibold text-black transition group-hover:bg-amber-100">
                  Read featured story
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            <aside className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                <FileText className="h-4 w-4" />
                News Brief
              </div>
              <div className="mt-5 grid gap-4">
                {latestThree.map((post) => (
                  <Link
                    key={post.id}
                    href={`/news/${post.id}`}
                    className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
                  >
                    <p className="text-xs font-medium text-amber-100/62">
                      {formatShortDate(post.createdAt)}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-white">
                      {post.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
              <Newspaper className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-white">No news has been published yet.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/62">
              Official JNC announcements will appear here when the editorial team publishes
              updates.
            </p>
          </div>
        )}

        {rest.length > 0 ? (
          <div className="mt-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/62">
                  More Stories
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  Latest dispatches
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-white/55">
                Browse official public updates from the JNC platform, arranged from newest to
                oldest.
              </p>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rest.map((post, index) => (
                <NewsCard key={post.id} post={post} index={index + 1} />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}
