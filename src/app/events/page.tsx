import type { Metadata } from "next";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { getEventResponseSummaryMap } from "@/lib/event-responses";
import { prisma } from "@/lib/prisma";
import EventsClient from "./ui/events-client";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Explore upcoming and past Jude Nnam Choral events, rehearsals, performances, and RSVP interest.",
  alternates: {
    canonical: "https://www.jnc-choral.vercel.app/events",
  },
};

export default async function EventsPage() {
  const now = new Date();

  const [upcoming, past] = await Promise.all([
    prisma.event.findMany({
      where: { isPublished: true, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 50,
    }),
    prisma.event.findMany({
      where: { isPublished: true, startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
      take: 50,
    }),
  ]);

  const summaryMap = await getEventResponseSummaryMap(
    [...upcoming, ...past].map((event) => event.id)
  );

  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h1 className="text-3xl font-semibold text-white md:text-4xl">Events</h1>
        <p className="mt-2 text-white/70">
          Rehearsals, performances, auditions, and special gatherings.
        </p>

        <EventsClient
          upcoming={upcoming.map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            imageUrl: event.imageUrl,
            videoUrl: event.videoUrl,
            startsAt: event.startsAt.toISOString(),
            endsAt: event.endsAt ? event.endsAt.toISOString() : null,
            summary: summaryMap.get(event.id) ?? {
              attending: 0,
              maybe: 0,
              notAttending: 0,
              total: 0,
            },
          }))}
          past={past.map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            imageUrl: event.imageUrl,
            videoUrl: event.videoUrl,
            startsAt: event.startsAt.toISOString(),
            endsAt: event.endsAt ? event.endsAt.toISOString() : null,
            summary: summaryMap.get(event.id) ?? {
              attending: 0,
              maybe: 0,
              notAttending: 0,
              total: 0,
            },
          }))}
        />
      </section>

      <SiteFooter />
    </main>
  );
}
