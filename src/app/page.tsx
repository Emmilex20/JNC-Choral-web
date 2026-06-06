import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import Hero from "@/components/hero";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  CalendarDays,
  CirclePlay,
  Clapperboard,
  HeartHandshake,
  KeyboardMusic,
  MapPin,
  MicVocal,
  Quote,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getBestVideoPosterUrl,
  getOptimizedCloudinaryVideoUrl,
} from "@/lib/cloudinary-media";

type IconComponent = ComponentType<{ className?: string }>;

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function HomeEventCard({
  event,
}: {
  event: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    startsAt: Date;
    endsAt: Date | null;
  };
}) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] transition hover:border-amber-200/30 hover:bg-white/[0.06]">
      <div className="relative h-64">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : event.videoUrl ? (
          <video
            src={event.videoUrl}
            controls
            className="h-full w-full bg-black object-cover"
          />
        ) : (
          <Image
            src="/hero/hero1.jpg"
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))]" />
        <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/85">
          <CalendarDays className="h-3.5 w-3.5" />
          Event
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-white">{event.title}</h3>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-amber-100/70">
          {fmt(event.startsAt)}
          {event.endsAt ? ` - ${fmt(event.endsAt)}` : ""}
        </p>
        {event.location ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-white/65">
            <MapPin className="h-4 w-4 text-cyan-200/80" />
            {event.location}
          </p>
        ) : null}
        {event.description ? (
          <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/72">
            {event.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}

const socialStats = [
  { value: "15+", label: "Years of Excellence" },
  { value: "250+", label: "Choristers Trained" },
  { value: "120+", label: "Performances" },
  { value: "10,000+", label: "Audience Members" },
];

const joinReasons: {
  title: string;
  body: string;
  icon: IconComponent;
}[] = [
  {
    title: "Singers",
    body: "Grow your voice across soprano, alto, tenor, and bass with disciplined section work.",
    icon: MicVocal,
  },
  {
    title: "Instrumentalists",
    body: "Bring keys, strings, percussion, brass, and musical sensitivity into a bigger sound.",
    icon: KeyboardMusic,
  },
  {
    title: "Production Crew",
    body: "Shape the visual story through media, sound, content, graphics, and stage support.",
    icon: Clapperboard,
  },
  {
    title: "Personal Growth",
    body: "Build confidence, musicianship, consistency, and the courage to perform with excellence.",
    icon: TrendingUp,
  },
  {
    title: "Community",
    body: "Find people who rehearse hard, encourage deeply, and celebrate every step forward.",
    icon: HeartHandshake,
  },
  {
    title: "Excellence",
    body: "Join a culture where preparation, worship, beauty, and discipline meet.",
    icon: Trophy,
  },
];

const journey = [
  {
    label: "Foundation",
    title: "A sound shaped by purpose",
    body: "JNC began with a simple conviction: music can gather people, lift faith, and create lasting joy.",
  },
  {
    label: "Training",
    title: "Voices are formed, not rushed",
    body: "Rehearsals focus on blend, tone, stage confidence, listening, and musical discipline.",
  },
  {
    label: "Performance",
    title: "The choir meets the moment",
    body: "From worship gatherings to concerts and special events, every performance carries preparation and heart.",
  },
  {
    label: "Next Generation",
    title: "New singers, players, and creators rise",
    body: "Auditions open the door for fresh voices, instrumentalists, and production talent to grow in the community.",
  },
];

const testimonials = [
  {
    quote:
      "Joining JNC transformed my musicianship and confidence. I found discipline, family, and a reason to keep growing.",
    name: "Chorister",
    role: "Soprano section",
  },
  {
    quote:
      "The rehearsals stretch you, but the people carry you. You leave better than you came.",
    name: "Chorister",
    role: "Tenor section",
  },
  {
    quote:
      "JNC gave me a place to serve with media and production while still being part of the music.",
    name: "Crew Member",
    role: "Production team",
  },
];

const fallbackGallery = [
  { id: "director-welcome", imageUrl: "/hero/hero-1.png", title: "Sir Jude with the choir" },
  { id: "instrumentalists", imageUrl: "/hero/hero-2.png", title: "Instrumental session" },
  { id: "auditions", imageUrl: "/hero/hero-3.png", title: "Audition season" },
  { id: "stage", imageUrl: "/hero/hero1.jpg", title: "Performance stage" },
];

const galleryLayout = [
  "md:col-span-2 md:row-span-2 md:h-[520px]",
  "md:col-span-1 md:h-[250px]",
  "md:col-span-1 md:h-[250px]",
  "md:col-span-2 md:h-[250px]",
  "md:col-span-1 md:h-[250px]",
  "md:col-span-1 md:h-[250px]",
  "md:col-span-2 md:h-[250px]",
  "md:col-span-1 md:h-[250px]",
];

export default async function HomePage() {
  const now = new Date();

  const [upcomingEvents, recentPastEvents, latestNews, latestGallery, latestVideos] =
    await Promise.all([
      prisma.event.findMany({
        where: { isPublished: true, startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        take: 3,
      }),
      prisma.event.findMany({
        where: { isPublished: true, startsAt: { lt: now } },
        orderBy: { startsAt: "desc" },
        take: 1,
      }),
      prisma.announcement.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.galleryItem.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.videoItem.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 2,
      }),
    ]);

  const homeEvents = [...upcomingEvents, ...recentPastEvents].slice(0, 3);
  const galleryShowcase =
    latestGallery.length > 0
      ? latestGallery.map((item) => ({
          id: item.id,
          imageUrl: item.imageUrl,
          title: item.title,
        }))
      : fallbackGallery;
  const featuredVideo = latestVideos[0] ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: "Jude Nnam Choral",
    url: "https://www.jnc-choral.vercel.app",
    description:
      "Jude Nnam Choral is a vibrant choir in Abuja, Nigeria. Auditions, events, and uplifting choral performances.",
    areaServed: "Nigeria",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Abuja",
      addressCountry: "NG",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "phone",
        telephone: "+2348064087399",
      },
      {
        "@type": "ContactPoint",
        contactType: "phone",
        telephone: "+234803943856",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteNavbar />
      <Hero />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
          {socialStats.map((stat) => (
            <div key={stat.label} className="py-4">
              <p className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm uppercase tracking-[0.18em] text-white/52">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-18 md:px-6 md:py-24">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">
            Why Join JNC?
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            A place for voices, skill, service, and growth.
          </h2>
          <p className="mt-4 text-base leading-8 text-white/68">
            JNC is not just a choir you sing with. It is a community where
            musicianship, discipline, friendship, and purpose are shaped through
            rehearsals, service, and performance.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {joinReasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <article
                key={reason.title}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 transition hover:border-cyan-200/25 hover:bg-white/[0.06]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-amber-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">
                  {reason.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/65">{reason.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-white text-black">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 md:px-6 md:py-24 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="relative min-h-[480px] overflow-hidden rounded-[2rem] bg-black">
            <Image
              src="/hero/hero-1.png"
              alt="Sir Jude standing with Jude Nnam Choral members"
              fill
              priority={false}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-top"
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-black/50">
              Director&apos;s Welcome
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              A message from Sir Jude.
            </h2>
            <div className="mt-8 border-l-2 border-amber-500 pl-6">
              <Quote className="h-8 w-8 text-amber-600" />
              <p className="mt-5 text-xl leading-9 text-black/78">
                Every voice carries a story. At Jude Nnam Choral, we train those
                stories into sound, discipline, worship, and joy. If you are
                ready to grow, serve, and be part of something bigger than
                yourself, there is room for you here.
              </p>
            </div>
            <div className="mt-8">
              <p className="text-lg font-semibold">Sir Jude Nnam</p>
              <p className="text-sm uppercase tracking-[0.18em] text-black/48">
                Founder and Director
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button className="rounded-2xl bg-black text-white hover:bg-black/90" asChild>
                <Link href="/auditions">Audition with JNC</Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-black/15 text-black hover:bg-black/5"
                asChild
              >
                <Link href="/about">Read our story</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-18 md:px-6 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">
              Choir Journey
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              How a sound becomes a movement.
            </h2>
            <p className="mt-4 text-base leading-8 text-white/65">
              The journey is not only public performances. It is the weekly work,
              the corrected notes, the friendships, the confidence, and the
              moments when many voices become one.
            </p>
          </div>

          <div className="grid gap-4">
            {journey.map((step, index) => (
              <article
                key={step.title}
                className="grid gap-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-[88px_1fr]"
              >
                <div>
                  <p className="text-3xl font-semibold text-amber-100">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/42">
                    {step.label}
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/65">{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#07110f]">
        <div className="mx-auto max-w-7xl px-4 py-18 md:px-6 md:py-24">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/70">
                Performance Highlights
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Watch JNC perform.
              </h2>
              <p className="mt-4 text-base leading-8 text-white/66">
                Sound sells the choir better than any paragraph. Feature recent
                performances, rehearsals, music videos, and public highlights here.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/videos">More videos</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black">
              {featuredVideo ? (
                <video
                  src={getOptimizedCloudinaryVideoUrl(featuredVideo.videoUrl)}
                  poster={
                    getBestVideoPosterUrl(featuredVideo.videoUrl, featuredVideo.posterUrl) ??
                    undefined
                  }
                  controls
                  playsInline
                  preload="none"
                  className="aspect-video w-full bg-black object-cover"
                />
              ) : (
                <Link href="/videos" className="group relative block aspect-video">
                  <Image
                    src="/hero/hero-2.png"
                    alt="JNC performance preview"
                    fill
                    sizes="(max-width: 1024px) 100vw, 70vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white backdrop-blur">
                      <CirclePlay className="h-10 w-10" />
                    </div>
                  </div>
                </Link>
              )}
            </div>

            <div className="grid gap-4">
              {(latestVideos.length > 1 ? latestVideos.slice(1) : []).map((video) => (
                <article
                  key={video.id}
                  className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04]"
                >
                  <video
                    src={getOptimizedCloudinaryVideoUrl(video.videoUrl)}
                    poster={getBestVideoPosterUrl(video.videoUrl, video.posterUrl) ?? undefined}
                    controls
                    playsInline
                    preload="none"
                    className="aspect-video w-full bg-black object-cover"
                  />
                  <div className="p-4">
                    <p className="text-sm font-semibold text-white">
                      {video.title ?? "JNC performance highlight"}
                    </p>
                  </div>
                </article>
              ))}
              <div className="rounded-[1.5rem] border border-emerald-200/15 bg-emerald-300/8 p-6">
                <Sparkles className="h-6 w-6 text-emerald-100" />
                <p className="mt-4 text-lg font-semibold text-white">
                  Upload more performance videos from the admin dashboard to keep
                  this section fresh.
                </p>
                <p className="mt-3 text-sm leading-7 text-white/62">
                  Public visitors should hear the blend, see the room, and feel
                  the energy before they apply.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-18 md:px-6 md:py-24">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-rose-100/70">
              Gallery Showcase
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Rehearsals, concerts, backstage moments, and the people.
            </h2>
          </div>
          <Button
            variant="outline"
            className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
            asChild
          >
            <Link href="/gallery">Open gallery</Link>
          </Button>
        </div>

        <div className="mt-10 grid auto-rows-[250px] gap-4 md:grid-cols-4">
          {galleryShowcase.map((item, index) => (
            <Link
              key={item.id}
              href="/gallery"
              className={`group relative h-72 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] ${galleryLayout[index] ?? "md:h-[250px]"}`}
            >
              <Image
                src={item.imageUrl}
                alt={item.title ?? "JNC gallery moment"}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.76))]" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-sm font-semibold text-white">
                  {item.title ?? "JNC moment"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white text-black">
        <div className="mx-auto max-w-7xl px-4 py-18 md:px-6 md:py-24">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-black/50">
              Success Stories
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              What changes when people join the sound.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((story) => (
              <article
                key={story.quote}
                className="rounded-[1.5rem] border border-black/10 bg-black/[0.03] p-6"
              >
                <Quote className="h-7 w-7 text-amber-600" />
                <p className="mt-5 text-base leading-8 text-black/76">
                  &ldquo;{story.quote}&rdquo;
                </p>
                <div className="mt-6">
                  <p className="font-semibold text-black">{story.name}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-black/45">
                    {story.role}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-18 md:px-6 md:py-24">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">
              Live Dates and Updates
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Meet the choir in motion.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/events">Events</Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/news">News</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {homeEvents.length > 0 ? (
            homeEvents.map((event) => <HomeEventCard key={event.id} event={event} />)
          ) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-sm leading-7 text-white/62 lg:col-span-2">
              Published events will appear here when the admin team adds them.
            </div>
          )}
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
              <Users className="h-4 w-4" />
              Latest news
            </div>
            <div className="mt-5 grid gap-4">
              {latestNews.length > 0 ? (
                latestNews.map((post) => (
                  <Link
                    key={post.id}
                    href={`/news/${post.id}`}
                    className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
                  >
                    <p className="line-clamp-2 text-sm font-semibold text-white">
                      {post.title}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/58">
                      {post.body}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm leading-7 text-white/58">
                  Choir announcements will appear here when published.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[linear-gradient(180deg,#101010,#050505)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">
              Ready to be part of the sound?
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Bring your voice, instrument, camera, or craft into JNC.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/65">
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
      </section>

      <SiteFooter />
    </main>
  );
}
