import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, HeartHandshake, Music2, Quote, Sparkles } from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { listPublishedSpotlights } from "@/lib/spotlights";

export const metadata: Metadata = {
  title: "Chorister Spotlights",
  description:
    "Meet featured JNC choristers and community members through weekly stories, musical journeys, favorite songs, and advice.",
  alternates: {
    canonical: "/community/spotlights",
  },
  openGraph: {
    title: "JNC Chorister Spotlights",
    description:
      "Weekly featured member stories from the Jude Nnam Choral community.",
    url: "/community/spotlights",
    images: ["/logo.svg"],
  },
};

type Spotlight = Awaited<ReturnType<typeof listPublishedSpotlights>>[number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function photo(spotlight: Spotlight) {
  return spotlight.photoUrl || spotlight.featuredUser?.image || "/logo.svg";
}

function SpotlightCard({ spotlight }: { spotlight: Spotlight }) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045]">
      <div className="relative aspect-[4/3] bg-black">
        <Image
          src={photo(spotlight)}
          alt={spotlight.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className={photo(spotlight) === "/logo.svg" ? "object-contain p-12" : "object-cover"}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.76))]" />
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/70">
            Week of {formatDate(spotlight.weekStart)}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{spotlight.name}</h2>
        </div>
      </div>
      <div className="p-5">
        <p className="line-clamp-3 text-sm leading-7 text-white/64">{spotlight.story}</p>
        {spotlight.favoriteSong ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/24 px-3 py-1.5 text-xs font-semibold text-white/64">
            <Music2 className="h-3.5 w-3.5 text-amber-100" />
            {spotlight.favoriteSong}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default async function SpotlightsPage() {
  const spotlights = await listPublishedSpotlights();
  const [current, ...archive] = spotlights;

  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#08111f_52%,#101007_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
              <HeartHandshake className="h-3.5 w-3.5" />
              Chorister Spotlight
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Stories from the people inside the sound.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Meet featured JNC members, their musical journeys, favorite songs, and advice for
              singers and creatives growing in the choir community.
            </p>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="mt-5 text-sm uppercase tracking-[0.22em] text-white/45">
              Published Stories
            </p>
            <p className="mt-3 text-4xl font-semibold text-white">{spotlights.length}</p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Featured members in the community archive.
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        {current ? (
          <article className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-96 bg-black">
              <Image
                src={photo(current)}
                alt={current.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 48vw"
                className={photo(current) === "/logo.svg" ? "object-contain p-16" : "object-cover"}
              />
            </div>
            <div className="p-6 md:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/62">
                Weekly Feature / {formatDate(current.weekStart)}
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                {current.name}
              </h2>
              <div className="mt-7 border-l-2 border-amber-300/70 pl-5">
                <Quote className="h-7 w-7 text-amber-100" />
                <p className="mt-4 text-lg leading-9 text-white/74">{current.story}</p>
              </div>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/42">
                    Musical Journey
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/68">
                    {current.musicalJourney}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/42">
                    Favorite Song
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-7 text-white">
                    {current.favoriteSong || "JNC repertoire"}
                  </p>
                  {current.advice ? (
                    <>
                      <p className="mt-5 text-xs uppercase tracking-[0.18em] text-white/42">
                        Advice
                      </p>
                      <p className="mt-2 text-sm leading-7 text-white/68">{current.advice}</p>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-amber-100" />
            <h2 className="mt-4 text-2xl font-semibold text-white">
              No spotlight has been published yet.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/62">
              Weekly member stories will appear here once the admin team publishes them.
            </p>
          </div>
        )}

        {archive.length > 0 ? (
          <div className="mt-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/62">
                  Spotlight Archive
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  More community stories
                </h2>
              </div>
              <Link
                href="/choristers"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white/68 transition hover:text-white"
              >
                Chorister portal
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {archive.map((spotlight) => (
                <SpotlightCard key={spotlight.id} spotlight={spotlight} />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}
