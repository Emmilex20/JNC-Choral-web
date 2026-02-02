import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import Hero from "@/components/hero";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default async function HomePage() {
  const now = new Date();

  const featuredEvent = await prisma.event.findFirst({
    where: { isPublished: true, startsAt: { gte: now } },
    orderBy: { startsAt: "asc" },
  });

  const latestAnnouncement = await prisma.announcement.findFirst({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
  });

  const latestGallery = await prisma.galleryItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const featureCards = [
    {
      title: "A choir with soul",
      body:
        "We blend worship, contemporary gospel, and classical roots into a signature sound.",
      image: "/hero/slide-1.svg",
    },
    {
      title: "Live performance ready",
      body:
        "From intimate stages to large audiences, we train for excellence and confidence.",
      image: "/hero/slide-2.svg",
    },
    {
      title: "Creative production",
      body:
        "Media, design, and content teams craft the moments you see and share.",
      image: "/hero/slide-3.svg",
    },
  ];

  const pathways = [
    {
      title: "Singers",
      body:
        "Soprano, Alto, Tenor, Bass. Develop your voice with expert direction.",
    },
    {
      title: "Instrumentalists",
      body:
        "Keys, strings, drums, and brass. Elevate the choral soundscape.",
    },
    {
      title: "Production",
      body:
        "Media, graphics, content, and stage management for standout experiences.",
    },
  ];

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
    <main className="min-h-screen bg-black">
      <SiteNavbar />
      <Hero />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">
              Spotlight
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              A modern choral movement
            </h2>
          </div>
          <p className="text-sm text-white/60 md:max-w-md">
            From rehearsals to live events, we build a culture of excellence and
            community.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {featureCards.map((c) => (
            <div
              key={c.title}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div
                className="absolute inset-0 scale-105 bg-cover bg-center opacity-25 transition group-hover:scale-110"
                style={{ backgroundImage: `url(${c.image})` }}
              />
              <div className="absolute inset-0 bg-black/55" />
              <div className="relative">
                <h3 className="text-lg font-semibold text-white">{c.title}</h3>
                <p className="mt-2 text-sm text-white/70">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Featured Event */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
            <h2 className="text-2xl font-semibold text-white">Featured Event</h2>
            {featuredEvent ? (
              <>
                <p className="mt-3 text-lg font-semibold text-white">
                  {featuredEvent.title}
                </p>
                <p className="mt-1 text-sm text-white/70">{fmt(featuredEvent.startsAt)}</p>
                {featuredEvent.location ? (
                  <p className="mt-1 text-sm text-white/70">{featuredEvent.location}</p>
                ) : null}
                {featuredEvent.description ? (
                  <p className="mt-3 text-white/75">{featuredEvent.description}</p>
                ) : null}
                <div className="mt-6">
                  <Button className="rounded-2xl" asChild>
                    <Link href="/events">View all events</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-white/70">
                  No upcoming event published yet. Admin can publish events in the dashboard.
                </p>
                <div className="mt-6">
                  <Button className="rounded-2xl" asChild>
                    <Link href="/events">Events page</Link>
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Latest Announcement */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
            <h2 className="text-2xl font-semibold text-white">Latest Announcement</h2>
            {latestAnnouncement ? (
              <>
                <p className="mt-3 text-lg font-semibold text-white">
                  {latestAnnouncement.title}
                </p>
                <p className="mt-3 line-clamp-5 text-white/75 whitespace-pre-wrap">
                  {latestAnnouncement.body}
                </p>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    asChild
                  >
                    <Link href="/news">Read all announcements</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-white/70">
                  No announcement published yet. Admin can publish announcements in the dashboard.
                </p>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    asChild
                  >
                    <Link href="/news">Announcements page</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {pathways.map((p) => (
            <div
              key={p.title}
              className="rounded-3xl border border-white/10 bg-black/30 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm text-white/70">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">
              Director&apos;s note
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              Excellence, discipline, and joy
            </h3>
            <p className="mt-3 text-sm text-white/70">
              We are building a platform where every voice matters. Our focus is
              on growth, musicianship, and a community that serves with passion.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="rounded-2xl" asChild>
                <Link href="/auditions">Join the choir</Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/news">Latest updates</Link>
              </Button>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-35"
              style={{ backgroundImage: "url(/hero/slide-2.svg)" }}
            />
            <div className="absolute inset-0 bg-black/55" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.22em] text-white/50">
                Next rehearsal
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                Tuesdays, 6:00 PM
              </h3>
              <p className="mt-2 text-sm text-white/70">
                Catholic Secretariat, Durumi Abuja.
              </p>
              <div className="mt-6 text-xs text-white/60">
                Doors open 30 minutes before start.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              name: "Chinwe, Soprano",
              quote:
                "The discipline and community helped me grow faster than any choir I have joined.",
            },
            {
              name: "Emeka, Keys",
              quote:
                "We perform with excellence. It feels like family and a masterclass at once.",
            },
            {
              name: "Amina, Media",
              quote:
                "From backstage to stage, every role feels meaningful and celebrated.",
            },
          ].map((t) => (
            <div
              key={t.name}
              className="rounded-3xl border border-white/10 bg-black/30 p-6"
            >
              <p className="text-sm text-white/70">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 text-xs uppercase tracking-[0.22em] text-white/50">
                {t.name}
              </p>
            </div>
          ))}
        </div>

        {/* Gallery Preview */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Gallery</h2>
              <p className="mt-1 text-white/70">A quick peek at recent moments.</p>
            </div>

            <Button className="rounded-2xl" asChild>
              <Link href="/gallery">Open Gallery</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {latestGallery.map((g: { id: string; imageUrl: string; title: string | null }) => (
              <div key={g.id} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <img
                  src={g.imageUrl}
                  alt={g.title ?? "Gallery"}
                  className="h-44 w-full rounded-xl object-cover"
                />
                {g.title ? (
                  <p className="mt-2 text-sm font-semibold text-white line-clamp-1">{g.title}</p>
                ) : (
                  <p className="mt-2 text-sm text-white/60"> </p>
                )}
              </div>
            ))}
            {latestGallery.length === 0 ? (
              <p className="text-sm text-white/60">No images yet. Admin can upload in dashboard.</p>
            ) : null}
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),transparent_60%)] p-8 md:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">
                Ready to be part of the sound?
              </h2>
              <p className="mt-2 text-white/70">
                Apply now or connect with our team for inquiries and collaborations.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-2xl" asChild>
                <Link href="/auditions">Register now</Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
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
