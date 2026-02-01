import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { prisma } from "@/lib/prisma";
import GalleryClient from "./ui/gallery-client";

export default async function GalleryPage() {
  const items = await prisma.galleryItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h1 className="text-3xl font-semibold text-white md:text-4xl">Gallery</h1>
        <p className="mt-2 text-white/70">
          Moments, performances, rehearsals, and memories.
        </p>

        <div className="mt-10">
          <GalleryClient items={items} />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
