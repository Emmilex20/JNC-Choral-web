import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpenText,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  MicVocal,
  Music2,
  Sparkles,
  Users,
} from "lucide-react";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { jncEntityKeywords, songKeywords, uniqueKeywords } from "@/lib/seo-keywords";
import { versionedHeroAsset } from "@/lib/site-assets";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Jude Nnam Chorale, a Nigerian liturgical and gospel choir founded by Dr. Sir Jude Nnam and dedicated to contemporary African choral music.",
  alternates: {
    canonical: "https://www.jncchorale.com/about",
  },
  keywords: uniqueKeywords(jncEntityKeywords, songKeywords, [
    "Sir Jude Nnam biography",
    "Dr Sir Jude Nnam biography",
    "Jude Nnam Chorale history",
    "about Jude Nnam Chorale",
    "Jude Nnam gospel composer",
    "Nigerian liturgical composer",
  ]),
};

const highlights = [
  {
    title: "Founder-led sound",
    body: "Directed by Dr. Sir Jude Nnam, a celebrated composer and respected figure in Nigerian liturgical music.",
    icon: MicVocal,
  },
  {
    title: "African liturgical music",
    body: "JNC performs, arranges, records, and promotes Catholic and Christian choral music rooted in African expression.",
    icon: Music2,
  },
  {
    title: "Training and showcase",
    body: "The choir supports masterclasses, auditions, open rehearsals, and online music challenges for choristers.",
    icon: GraduationCap,
  },
  {
    title: "National presence",
    body: "JNC appears at praise concerts, cultural gatherings, and religious events across Nigeria.",
    icon: CalendarDays,
  },
];

const repertoire = [
  "Chukwu Di Nso",
  "Kimvwama",
  "Chinecherem",
  "Contemporary African Mass settings",
  "Catholic and Christian liturgical hymns",
  "Original gospel and praise arrangements",
];

const pillars = [
  {
    title: "Perform",
    body: "Bringing choral excellence to worship spaces, concerts, rehearsals, and national gatherings.",
  },
  {
    title: "Preserve",
    body: "Keeping African sacred music visible, singable, and meaningful for new generations.",
  },
  {
    title: "Train",
    body: "Raising choristers, instrumentalists, and creatives through discipline, mentorship, and exposure.",
  },
];

const impactStats = [
  { value: "15+", label: "Years of musical influence" },
  { value: "250+", label: "Choristers trained" },
  { value: "120+", label: "Performances and showcases" },
  { value: "10,000+", label: "Audience members reached" },
];

const activities = [
  {
    title: "Open rehearsals",
    body: "A space for singers to experience the discipline, warmth, and sound of JNC.",
    icon: Users,
  },
  {
    title: "Praise concerts",
    body: "Public worship and performance moments built around choral excellence.",
    icon: Sparkles,
  },
  {
    title: "Masterclasses",
    body: "Training sessions connected to Dr. Sir Jude Nnam's broader teaching mission.",
    icon: GraduationCap,
  },
  {
    title: "Online challenges",
    body: "Digital platforms for discovering, encouraging, and showcasing choristers nationwide.",
    icon: HeartHandshake,
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteNavbar />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.13),transparent_45%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-100/70">
              About Jude Nnam Chorale
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
              A Nigerian liturgical and gospel choir carrying African sacred
              music with excellence.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
              Jude Nnam Chorale, known as JNC, is a prominent Nigerian choral
              family founded by the acclaimed composer and music icon Dr. Sir
              Jude Nnam. The choir is celebrated for performing, arranging, and
              promoting contemporary African choral music, especially Catholic
              and Christian liturgical songs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="rounded-2xl px-6" asChild>
                <Link href="/auditions">Join the choir</Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/videos">Watch performances</Link>
              </Button>
            </div>
          </div>

          <div className="relative z-10">
            <div className="overflow-hidden rounded-4xl border border-white/10 bg-white/5">
              <div className="relative aspect-video">
                <Image
                  src={versionedHeroAsset("/hero/hero-1.png")}
                  alt="Dr. Sir Jude Nnam standing with members of Jude Nnam Chorale"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-top"
                />
              </div>
              <div className="border-t border-white/10 bg-black/55 p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-amber-100/75">
                  Founder and Director
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  Dr. Sir Jude Nnam
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/72">
                  Revered by many in the Nigerian gospel music scene as the
                  Ancestor of Liturgical Music.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {impactStats.map((stat) => (
            <div key={stat.label} className="border-b border-white/10 pb-6">
              <p className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/50">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">
            Key Highlights
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            A choir built around sound, faith, culture, and formation.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/4 p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-amber-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/65">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-white text-black">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-black/50">
              Repertoire
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Songs that carry worship, language, and African choral identity.
            </h2>
            <p className="mt-5 text-base leading-8 text-black/68">
              JNC is known for interpreting both traditional and contemporary
              African liturgical works. Its repertoire includes widely loved
              pieces associated with Dr. Sir Jude Nnam&apos;s sacred music
              legacy, alongside fresh arrangements for worship and performance.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {repertoire.map((song) => (
              <div
                key={song}
                className="flex items-center gap-3 rounded-[1.25rem] border border-black/10 bg-black/3 p-4"
              >
                <BookOpenText className="h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-sm font-medium text-black/76">{song}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">
              What JNC Does
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              More than a choir, JNC is a living school of sacred music.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/65">
              The group often serves as the performing arm for the Maestro&apos;s
              masterclasses, auditions, and music challenges. Through these
              activities, JNC trains choristers, showcases emerging talent, and
              keeps African liturgical music active in public worship and
              national cultural life.
            </p>
          </div>

          <div className="grid gap-4">
            {pillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-3xl border border-white/10 bg-white/4 p-6"
              >
                <h3 className="text-2xl font-semibold text-white">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/66">
                  {pillar.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#07110f]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/70">
              Activities
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Where the music becomes visible.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <article
                  key={activity.title}
                  className="rounded-3xl border border-white/10 bg-white/4 p-6"
                >
                  <Icon className="h-6 w-6 text-emerald-100" />
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {activity.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/65">
                    {activity.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-white/4">
          <div className="absolute inset-0 opacity-20">
            <Image
              src="/hero/hero-2.png"
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/68" />
          <div className="relative grid gap-8 p-8 md:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">
                Join the living sound
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Be part of a choir that trains, performs, worships, and carries
                African sacred music forward.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/66">
                Auditions are open to singers, instrumentalists, and production
                creatives who want to grow in excellence and community.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button className="rounded-2xl px-6 py-6" asChild>
                <Link href="/auditions">Register now</Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 px-6 py-6 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
