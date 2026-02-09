import { prisma } from "@/lib/prisma";
import AdminAuditionsClient from "./ui/admin-auditions-client";
import AdminAnnouncementsClient from "./announcements/ui/admin-announcements-client";
import AdminEventsClient from "./events/ui/admin-events-client";
import AdminGalleryClient from "./gallery/ui/admin-gallery-client";
import AdminMusicClient from "./music/ui/admin-music-client";
import AdminUsersClient from "./users/ui/admin-users-client";
import AdminVideosClient from "./videos/ui/admin-videos-client";
import AdminChoristerNoticesClient from "./choristers/ui/admin-chorister-notices-client";
import AdminRehearsalsClient from "./choristers/ui/admin-rehearsals-client";
import AdminPendingChoristersClient from "./choristers/ui/admin-pending-choristers-client";
import AdminChoristersClient from "./choristers/ui/admin-choristers-client";

export default async function AdminPage() {
  const [
    rows,
    events,
    posts,
    items,
    music,
    videos,
    users,
    choristers,
    pendingChoristers,
    choristerNotices,
    rehearsals,
    pendingAttendance,
  ] = await Promise.all([
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
    prisma.musicItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.videoItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.user.findMany({
      where: { isChorister: true, choristerVerified: true },
      orderBy: { createdAt: "desc" },
      take: 300,
      include: {
        choristerProfile: true,
        choristerAttendances: {
          include: {
            rehearsal: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { isChorister: true, choristerVerified: false },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.choristerNotice.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.rehearsal.findMany({
      orderBy: { startsAt: "desc" },
      take: 200,
      include: { attendance: true },
    }),
    prisma.attendanceRecord.findMany({
      where: { confirmedAt: null },
      orderBy: { markedAt: "desc" },
      take: 300,
      include: {
        user: { select: { name: true, email: true } },
        rehearsal: { select: { title: true, startsAt: true } },
      },
    }),
  ]);

  const rehearsalRows = rehearsals.map((r) => ({
    id: r.id,
    title: r.title,
    startsAt: r.startsAt.toISOString(),
    attendanceCount: r.attendance.length,
    confirmedCount: r.attendance.filter((a) => a.confirmedAt).length,
  }));

  const pendingAttendanceRows = pendingAttendance.map((p) => ({
    id: p.id,
    rehearsalTitle: p.rehearsal.title,
    rehearsalDate: p.rehearsal.startsAt.toISOString(),
    userName: p.user.name,
    userEmail: p.user.email,
    markedAt: p.markedAt.toISOString(),
  }));

  const navItems = [
    { label: "Auditions", href: "#auditions" },
    { label: "Events", href: "#events" },
    { label: "Announcements", href: "#announcements" },
    { label: "Gallery", href: "#gallery" },
    { label: "Music", href: "#music" },
    { label: "Videos", href: "#videos" },
    { label: "Chorister Notices", href: "#chorister-notices" },
    { label: "Rehearsals", href: "#rehearsals" },
    { label: "Pending Choristers", href: "#pending-choristers" },
    { label: "Choristers", href: "#choristers" },
    { label: "Users", href: "#users" },
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

        <section id="music" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Music
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Upload audio tracks to publish on the public Music page.
            </p>
          </div>
          <AdminMusicClient initialItems={music} />
        </section>

        <section id="videos" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Videos
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Upload performance videos to show on the public Videos page.
            </p>
          </div>
          <AdminVideosClient initialItems={videos} />
        </section>

        <section id="chorister-notices" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Chorister Notices
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Updates visible to verified choristers on their dashboard.
            </p>
          </div>
          <AdminChoristerNoticesClient
            initialNotices={choristerNotices.map((n) => ({
              id: n.id,
              title: n.title,
              body: n.body,
              attachmentUrl: n.attachmentUrl,
              isPublished: n.isPublished,
              createdAt: n.createdAt.toISOString(),
            }))}
          />
        </section>

        <section id="rehearsals" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Rehearsals & Attendance
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Create rehearsals and confirm chorister attendance.
            </p>
          </div>
          <AdminRehearsalsClient
            initialRehearsals={rehearsalRows}
            initialPending={pendingAttendanceRows}
          />
        </section>

        <section id="pending-choristers" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Pending Choristers
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Users awaiting chorister verification.
            </p>
          </div>
          <AdminPendingChoristersClient
            initialUsers={pendingChoristers.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              createdAt: u.createdAt.toISOString(),
            }))}
          />
        </section>

        <section id="choristers" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Choristers
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Verified choristers only.
            </p>
          </div>
          <AdminChoristersClient
            initialChoristers={choristers.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              adminNote: u.adminNote,
              createdAt: u.createdAt.toISOString(),
              profile: u.choristerProfile
                ? {
                    phone: u.choristerProfile.phone,
                    address: u.choristerProfile.address,
                    voicePart: u.choristerProfile.voicePart,
                    dateOfBirth: u.choristerProfile.dateOfBirth
                      ? u.choristerProfile.dateOfBirth.toISOString()
                      : null,
                    emergencyContact: u.choristerProfile.emergencyContact,
                    stateOfOrigin: u.choristerProfile.stateOfOrigin,
                    currentParish: u.choristerProfile.currentParish,
                  }
                : null,
              attendance: u.choristerAttendances.map((a) => ({
                id: a.id,
                rehearsalTitle: a.rehearsal.title,
                startsAt: a.rehearsal.startsAt.toISOString(),
                markedAt: a.markedAt.toISOString(),
                confirmedAt: a.confirmedAt ? a.confirmedAt.toISOString() : null,
              })),
            }))}
          />
        </section>

        <section id="users" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Users
            </h2>
            <p className="mt-2 text-sm text-white/70">
              View all users, edit profiles/roles, and remove accounts.
            </p>
          </div>
          <AdminUsersClient initialUsers={users} />
        </section>
      </div>
    </div>
  );
}
