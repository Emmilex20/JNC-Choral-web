import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { prisma } from "@/lib/prisma";
import VideosClient from "./ui/videos-client";

export default async function VideosPage() {
  const items = await prisma.videoItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">
              Media
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
              Video Highlights
            </h1>
            <p className="mt-3 text-white/70 md:max-w-xl">
              Performances, rehearsals, and behind-the-scenes moments captured
              to inspire and invite you deeper into the sound.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            {items.length} video{items.length === 1 ? "" : "s"} available
          </div>
        </div>

        <VideosClient items={items} />
      </section>

      <SiteFooter />
    </main>
  );
}
