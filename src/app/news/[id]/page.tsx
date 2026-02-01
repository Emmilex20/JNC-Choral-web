import { notFound } from "next/navigation";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { prisma } from "@/lib/prisma";

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(d);
}

export default async function NewsDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const announcement = await prisma.announcement.findFirst({
    where: { id: params.id, isPublished: true },
  });

  if (!announcement) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />

      <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <div className="text-xs text-white/60">
          {fmt(announcement.createdAt)}
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
          {announcement.title}
        </h1>
        <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-white/80">
          {announcement.body}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
