import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Disc3,
  FileMusic,
  Headphones,
  LockKeyhole,
  Music2,
} from "lucide-react";

import { authOptions } from "@/auth";
import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import {
  getMusicSheetAccess,
  listPublicScoreSheets,
  listVisibleMusicSheets,
} from "@/lib/music-sheets";
import { prisma } from "@/lib/prisma";
import { jncEntityKeywords, mediaKeywords, scoreKeywords, songKeywords, uniqueKeywords } from "@/lib/seo-keywords";
import { versionedHeroAsset } from "@/lib/site-assets";
import MusicClient from "./ui/music-client";

const siteUrl = "https://www.jncchorale.com";
const description =
  "Listen to Jude Nnam Chorale music, live recordings, worship sessions, and access available JNC scores and choir sheets.";

export const metadata: Metadata = {
  title: "Music Library",
  description,
  alternates: {
    canonical: "/music",
  },
  keywords: uniqueKeywords(jncEntityKeywords, mediaKeywords, scoreKeywords, songKeywords, [
    "JNC live recordings",
    "Nigerian gospel choir music",
    "Jude Nnam worship songs",
  ]),
  openGraph: {
    title: "Jude Nnam Chorale Music Library",
    description,
    url: "/music",
    type: "music.playlist",
    images: [versionedHeroAsset("/hero/hero-1.png")],
  },
};

export default async function MusicPage() {
  const session = await getServerSession(authOptions);
  const access = await getMusicSheetAccess(session);

  const [items, sheets, publicScores] = await Promise.all([
    prisma.musicItem.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        audioUrl: true,
        createdAt: true,
      },
      take: 200,
    }),
    listVisibleMusicSheets(access),
    listPublicScoreSheets(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Jude Nnam Chorale Music Library",
    description,
    url: `${siteUrl}/music`,
    isPartOf: {
      "@type": "WebSite",
      name: "Jude Nnam Chorale",
      url: siteUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((track, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: track.title ?? "JNC track",
        url: `${siteUrl}/music`,
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
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
              <Music2 className="h-3.5 w-3.5" />
              JNC Music Library
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Listen, rehearse, and carry the sound with you.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Stream public uploads, discover recent releases, and access available scores
              and choir sheets according to your account permissions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button className="rounded-2xl bg-amber-200 px-6 py-6 text-black hover:bg-amber-100" asChild>
                <Link href="#latest-releases">
                  Start listening
                  <Headphones className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 px-6 py-6 text-white hover:bg-white/9"
                asChild
              >
                <Link href="/scores">
                  Open scores bank
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <aside className="overflow-hidden rounded-4xl border border-white/10 bg-white/4.5 shadow-[0_26px_80px_rgba(0,0,0,0.32)]">
            <div className="relative aspect-4/3">
              <Image
                src={versionedHeroAsset("/hero/hero-1.png")}
                alt="Jude Nnam Chorale music library"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.82))]" />
              <div className="absolute bottom-5 left-5 right-5">
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {[
                    {
                      label: "Tracks",
                      value: items.length,
                      icon: Disc3,
                    },
                    {
                      label: "Public scores",
                      value: publicScores.length,
                      icon: FileMusic,
                    },
                    {
                      label: access.isSignedIn ? "Access ready" : "Sign-in gated",
                      value: access.isSignedIn ? "Unlocked" : "Protected",
                      icon: LockKeyhole,
                    },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="rounded-2xl border border-white/12 bg-black/48 p-4 backdrop-blur"
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/78">
                          <Icon className="h-3.5 w-3.5" />
                          {stat.label}
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:py-16">
        <MusicClient
          items={items.map((item) => ({
            id: item.id,
            title: item.title,
            audioUrl: item.audioUrl,
            createdAt: item.createdAt.toISOString(),
          }))}
          sheets={sheets.map((sheet) => ({
            id: sheet.id,
            title: sheet.title,
            slug: sheet.slug,
            composer: sheet.composer,
            fileName: sheet.fileName,
            audience: sheet.audience,
            createdAt: sheet.createdAt.toISOString(),
            downloadUrl: `/api/music-sheets/${sheet.id}/download`,
          }))}
          isSignedIn={access.isSignedIn}
          canAccessChoristerSheets={access.canAccessChoristerSheets}
        />
      </section>

      <SiteFooter />
    </main>
  );
}
