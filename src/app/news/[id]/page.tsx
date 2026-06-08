import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Newspaper,
  Sparkles,
} from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { prisma } from "@/lib/prisma";

const siteUrl = "https://www.jncchorale.com";

type NewsDetailProps = {
  params: Promise<{ id: string }>;
};

type NewsPost = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function excerpt(value: string, limit = 155) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit).trim()}...`;
}

function readingMinutes(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

function paragraphs(value: string) {
  return value
    .split(/\n{2,}|\r\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

async function getPost(id: string) {
  return prisma.announcement.findFirst({
    where: { id, isPublished: true },
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function generateMetadata({ params }: NewsDetailProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      title: "News Not Found",
    };
  }

  const title = `${post.title} | JNC News`;
  const description = excerpt(post.body, 155);

  return {
    title,
    description,
    alternates: {
      canonical: `/news/${post.id}`,
    },
    openGraph: {
      title,
      description,
      url: `/news/${post.id}`,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
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

function RelatedPost({ post }: { post: NewsPost }) {
  return (
    <Link
      href={`/news/${post.id}`}
      className="group border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
    >
      <p className="text-xs font-medium text-amber-100/62">{formatDate(post.createdAt)}</p>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-white transition group-hover:text-amber-100">
        {post.title}
      </h3>
      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/45">
        Read update
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

export default async function NewsDetailPage({ params }: NewsDetailProps) {
  const { id } = await params;
  const [announcement, latest] = await Promise.all([
    getPost(id),
    prisma.announcement.findMany({
      where: { isPublished: true, NOT: { id } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 4,
    }),
  ]);

  if (!announcement) {
    notFound();
  }

  const articleParagraphs = paragraphs(announcement.body);
  const description = excerpt(announcement.body, 180);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: announcement.title,
    description,
    datePublished: announcement.createdAt.toISOString(),
    dateModified: announcement.updatedAt.toISOString(),
    mainEntityOfPage: `${siteUrl}/news/${announcement.id}`,
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
  };

  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#07111f_52%,#101007_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 lg:py-16">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/76 transition hover:bg-white/[0.09] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to News
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
                <Newspaper className="h-3.5 w-3.5" />
                JNC Update
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {announcement.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                {description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/26 px-4 py-2 text-sm text-white/68">
                  <CalendarDays className="h-4 w-4 text-amber-100" />
                  {formatDate(announcement.createdAt)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/26 px-4 py-2 text-sm text-white/68">
                  <Clock3 className="h-4 w-4 text-cyan-100" />
                  {readingMinutes(announcement.body)} min read
                </span>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
              <div className="relative h-20 w-20 overflow-hidden rounded-[1.25rem] border border-amber-200/20 bg-black/36">
                <Image src="/logo.svg" alt="JNC logo" fill sizes="80px" className="object-cover" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Published By
              </p>
              <p className="mt-2 text-lg font-semibold text-white">Jude Nnam Chorale</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-14">
        <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 md:p-9">
          <div className="prose prose-invert max-w-none">
            {articleParagraphs.length > 0 ? (
              articleParagraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mb-6 whitespace-pre-line text-base leading-8 text-white/78 last:mb-0"
                >
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-base leading-8 text-white/78">{announcement.body}</p>
            )}
          </div>
        </article>

        <aside className="space-y-5">
          <div className="rounded-[1.5rem] border border-amber-200/15 bg-amber-200/8 p-5 text-sm leading-7 text-amber-50/84">
            <Sparkles className="mb-3 h-4 w-4" />
            Stay close to official JNC notices for auditions, concerts, rehearsals, score
            releases, and public media updates.
          </div>

          {latest.length > 0 ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Latest Updates
              </p>
              <div className="mt-5 grid gap-4">
                {latest.map((post) => (
                  <RelatedPost key={post.id} post={post} />
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </section>

      <SiteFooter />
    </main>
  );
}
