import Link from "next/link";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { prisma } from "@/lib/prisma";

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(d);
}

export default async function NewsPage() {
  const announcements = await prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />

      <section className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        <h1 className="text-3xl font-semibold text-white md:text-4xl">News</h1>
        <p className="mt-2 text-white/70">
          Updates, announcements, and choir news.
        </p>

        <div className="mt-8 grid gap-4">
          {announcements.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              No announcements yet.
            </div>
          ) : (
            announcements.map(
              (a: { id: string; title: string; body: string; createdAt: Date }) => (
              <Link
                key={a.id}
                href={`/news/${a.id}`}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
              >
                <div className="text-xs text-white/60">{fmt(a.createdAt)}</div>
                <h2 className="mt-2 text-lg font-semibold text-white group-hover:text-white">
                  {a.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-white/70">
                  {a.body}
                </p>
                <div className="mt-3 text-xs text-white/60">
                  Read more →
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
