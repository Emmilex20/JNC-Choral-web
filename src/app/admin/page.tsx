import { prisma } from "@/lib/prisma";
import AdminAuditionsClient from "./ui/admin-auditions-client";
import AdminAnnouncementsClient from "./announcements/ui/admin-announcements-client";
import AdminEventsClient from "./events/ui/admin-events-client";
import AdminGalleryClient from "./gallery/ui/admin-gallery-client";

export default async function AdminPage() {
  const [rows, events, posts, items] = await Promise.all([
    prisma.auditionApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.event.findMany({
      orderBy: { startsAt: "desc" },
      take: 200,
    }),
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.galleryItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
  ]);

  const navItems = [
    { label: "Auditions", href: "#auditions" },
    { label: "Events", href: "#events" },
    { label: "Announcements", href: "#announcements" },
    { label: "Gallery", href: "#gallery" },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-24 hidden h-fit rounded-3xl border border-white/10 bg-white/5 p-6 lg:block">
        <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-white/70">
          Manage auditions, events, announcements, and gallery in one place.
        </p>
        <nav className="mt-6 grid gap-2 text-sm">
          {navItems.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white/80 transition hover:border-white/20 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="space-y-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6 md:p-8 lg:hidden">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-white/70 text-sm">
            Manage auditions, events, announcements, and gallery in one place.
          </p>
          <div className="mt-4 -mx-2 flex gap-2 overflow-x-auto px-2 pb-1 text-xs">
            {navItems.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="whitespace-nowrap rounded-full border border-white/10 bg-black/40 px-3 py-1 text-white/80 transition hover:border-white/20 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <section id="auditions" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Auditions
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Review applications, update status, and export records.
            </p>
          </div>
          <AdminAuditionsClient initialRows={rows} />
        </section>

        <section id="events" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Events
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Create events and publish them to show on the public Events page.
            </p>
          </div>
          <AdminEventsClient initialEvents={events} />
        </section>

        <section id="announcements" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Announcements
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Write updates and publish them to show on the public News page.
            </p>
          </div>
          <AdminAnnouncementsClient initialPosts={posts} />
        </section>

        <section id="gallery" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Gallery
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Upload images to Cloudinary and publish them on the public Gallery page.
            </p>
          </div>
          <AdminGalleryClient initialItems={items} />
        </section>
      </div>
    </div>
  );
}
