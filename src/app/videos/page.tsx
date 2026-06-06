import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CirclePlay,
  Clapperboard,
  Film,
  Sparkles,
  Video,
} from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import VideosClient from "./ui/videos-client";

const siteUrl = "https://www.jnc-choral.vercel.app";
const description =
  "Watch Jude Nnam Choral performance videos, rehearsals, concert highlights, and behind-the-scenes media from JNC.";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Video Highlights",
  description,
  alternates: {
    canonical: "/videos",
  },
  keywords: [
    "Jude Nnam Choral videos",
    "JNC performance videos",
    "Sir Jude Nnam choir videos",
    "JNC rehearsals",
    "Nigerian gospel choir video",
  ],
  openGraph: {
    title: "Jude Nnam Choral Video Highlights",
    description,
    url: "/videos",
    type: "video.other",
    images: ["/hero/hero-2.png"],
  },
};

export default async function VideosPage() {
  const items = await prisma.videoItem.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      title: true,
      videoUrl: true,
      posterUrl: true,
      createdAt: true,
    },
    take: 200,
  });

  const featured = items[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Jude Nnam Choral Video Highlights",
    description,
    url: `${siteUrl}/videos`,
    isPartOf: {
      "@type": "WebSite",
      name: "Jude Nnam Choral",
      url: siteUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((videoItem, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: videoItem.title ?? "JNC video highlight",
        url: `${siteUrl}/videos`,
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
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
              <Film className="h-3.5 w-3.5" />
              Video Highlights
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              See the choir, hear the room, feel the moment.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Watch performances, rehearsals, public highlights, and behind-the-scenes stories
              that reveal the spirit and excellence of Jude Nnam Choral.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button className="rounded-2xl bg-amber-200 px-6 py-6 text-black hover:bg-amber-100" asChild>
                <Link href="#screening-room">
                  Watch latest
                  <CirclePlay className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/[0.05] px-6 py-6 text-white hover:bg-white/[0.09]"
                asChild
              >
                <Link href="/gallery">
                  View gallery
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <aside className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-[0_26px_80px_rgba(0,0,0,0.32)]">
            <div className="relative aspect-[4/3] bg-black">
              <Image
                src={featured?.posterUrl ?? "/hero/hero-2.png"}
                alt={featured?.title ?? "Jude Nnam Choral video feature"}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 430px"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.82))]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white backdrop-blur">
                  <CirclePlay className="h-10 w-10" />
                </div>
              </div>
              <div className="absolute bottom-5 left-5 right-5">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/54 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/82 backdrop-blur">
                  <Sparkles className="h-4 w-4 text-amber-100" />
                  {items.length} video{items.length === 1 ? "" : "s"} available
                </p>
                <h2 className="mt-4 text-2xl font-semibold leading-tight text-white">
                  {featured?.title ?? "The JNC screening room"}
                </h2>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Performance reels",
              body: "Stage moments, worship nights, concerts, and public highlights.",
              icon: CirclePlay,
            },
            {
              title: "Behind the scenes",
              body: "Rehearsal discipline, team culture, training, and production work.",
              icon: Clapperboard,
            },
            {
              title: "Spotlight stories",
              body: "Faces, voices, and creative stories behind the JNC sound.",
              icon: Video,
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 transition hover:border-amber-200/25 hover:bg-white/[0.065]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-white">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/62">{card.body}</p>
              </article>
            );
          })}
        </div>

        <VideosClient
          items={items.map((item) => ({
            id: item.id,
            title: item.title,
            videoUrl: item.videoUrl,
            posterUrl: item.posterUrl,
            createdAt: item.createdAt.toISOString(),
          }))}
        />
      </section>

      <SiteFooter />
    </main>
  );
}
