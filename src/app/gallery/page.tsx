import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Camera,
  Images,
  Sparkles,
  Theater,
} from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import GalleryClient from "./ui/gallery-client";

const siteUrl = "https://www.jnc-choral.vercel.app";
const description =
  "Browse the Jude Nnam Choral gallery with concert photos, rehearsal moments, choir memories, and media highlights from JNC.";

export const metadata: Metadata = {
  title: "Gallery",
  description,
  alternates: {
    canonical: "/gallery",
  },
  keywords: [
    "Jude Nnam Choral gallery",
    "JNC photos",
    "Sir Jude Nnam choir photos",
    "JNC concert pictures",
    "Nigerian choir gallery",
  ],
  openGraph: {
    title: "Jude Nnam Choral Gallery",
    description,
    url: "/gallery",
    type: "website",
    images: ["/hero/hero-2.png"],
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function GalleryPage() {
  const items = await prisma.galleryItem.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      createdAt: true,
    },
    take: 300,
  });

  const featured = items[0];
  const featuredImage = featured?.imageUrl ?? "/hero/hero-2.png";
  const latestUpdate = featured ? formatDate(featured.createdAt) : "Coming soon";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "Jude Nnam Choral Gallery",
    description,
    url: `${siteUrl}/gallery`,
    isPartOf: {
      "@type": "WebSite",
      name: "Jude Nnam Choral",
      url: siteUrl,
    },
    image: items.slice(0, 24).map((item) => ({
      "@type": "ImageObject",
      contentUrl: item.imageUrl,
      name: item.title ?? "JNC gallery moment",
      datePublished: item.createdAt.toISOString(),
    })),
  };

  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#07111f_50%,#101007_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
              <Images className="h-3.5 w-3.5" />
              JNC Gallery
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Moments from the music, the people, and the room.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Explore concert posters, rehearsal memories, stage highlights, backstage energy,
              and the visual story of Jude Nnam Choral.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button className="rounded-2xl bg-amber-200 px-6 py-6 text-black hover:bg-amber-100" asChild>
                <Link href="#gallery-archive">
                  Browse photos
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/[0.05] px-6 py-6 text-white hover:bg-white/[0.09]"
                asChild
              >
                <Link href="/videos">Watch videos</Link>
              </Button>
            </div>
          </div>

          <aside className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-[0_26px_80px_rgba(0,0,0,0.32)]">
            <div className="relative aspect-[4/5]">
              <Image
                src={featuredImage}
                alt={featured?.title ?? "Jude Nnam Choral gallery feature"}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 430px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.82))]" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/54 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/82 backdrop-blur">
                  <Sparkles className="h-4 w-4 text-amber-100" />
                  Featured frame
                </p>
                <h2 className="mt-4 text-2xl font-semibold leading-tight text-white">
                  {featured?.title ?? "The JNC visual archive"}
                </h2>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Published frames",
              value: `${items.length}`,
              body: "Concerts, rehearsals, posters, and choir memories.",
              icon: Camera,
            },
            {
              label: "Latest update",
              value: latestUpdate,
              body: "Fresh uploads appear first so returning visitors see what is new.",
              icon: Sparkles,
            },
            {
              label: "Media story",
              value: "JNC in motion",
              body: "Images are curated to show worship, training, community, and excellence.",
              icon: Theater,
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <article
                key={stat.label}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/38">
                    {stat.label}
                  </span>
                </div>
                <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
                  {stat.value}
                </p>
                <p className="mt-3 text-sm leading-7 text-white/62">{stat.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="gallery-archive" className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/62">
              Visual Archive
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Gallery showcase
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-white/58">
            Tap any image to view it larger. The gallery is arranged from newest to oldest.
          </p>
        </div>

        <GalleryClient
          items={items.map((item) => ({
            id: item.id,
            title: item.title,
            imageUrl: item.imageUrl,
            createdAt: item.createdAt.toISOString(),
          }))}
        />
      </section>

      <SiteFooter />
    </main>
  );
}
