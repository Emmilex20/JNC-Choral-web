import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { prisma } from "@/lib/prisma";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default async function EventsPage() {
  const now = new Date();

  const upcoming = await prisma.event.findMany({
    where: { isPublished: true, startsAt: { gte: now } },
    orderBy: { startsAt: "asc" },
    take: 50,
  });

  const past = await prisma.event.findMany({
    where: { isPublished: true, startsAt: { lt: now } },
    orderBy: { startsAt: "desc" },
    take: 50,
  });

  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h1 className="text-3xl font-semibold text-white md:text-4xl">Events</h1>
        <p className="mt-2 text-white/70">
          Rehearsals, performances, auditions, and special gatherings.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white">Upcoming</h2>
            <div className="mt-4 grid gap-3">
              {upcoming.length === 0 ? (
                <p className="text-sm text-white/60">No upcoming events yet.</p>
              ) : (
                upcoming.map((e: { id: Key | null | undefined; title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; startsAt: Date; endsAt: Date; location: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; description: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                  <div
                    key={e.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <p className="font-semibold text-white">{e.title}</p>
                    <p className="mt-1 text-xs text-white/70">
                      {fmt(e.startsAt)}
                      {e.endsAt ? ` – ${fmt(e.endsAt)}` : ""}
                    </p>
                    {e.location ? (
                      <p className="mt-1 text-xs text-white/70">{e.location}</p>
                    ) : null}
                    {e.description ? (
                      <p className="mt-2 text-sm text-white/75">{e.description}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white">Past</h2>
            <div className="mt-4 grid gap-3">
              {past.length === 0 ? (
                <p className="text-sm text-white/60">No past events yet.</p>
              ) : (
                past.map((e: { id: Key | null | undefined; title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; startsAt: Date; location: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; description: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                  <div
                    key={e.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <p className="font-semibold text-white">{e.title}</p>
                    <p className="mt-1 text-xs text-white/70">
                      {fmt(e.startsAt)}
                    </p>
                    {e.location ? (
                      <p className="mt-1 text-xs text-white/70">{e.location}</p>
                    ) : null}
                    {e.description ? (
                      <p className="mt-2 text-sm text-white/75">{e.description}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
