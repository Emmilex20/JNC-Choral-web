import { ArrowUpRight } from "lucide-react";

import { getEventResponseRowsMap } from "@/lib/event-responses";
import { listMusicSheetsForAdmin } from "@/lib/music-sheets";
import { prisma } from "@/lib/prisma";
import AdminAnnouncementsClient from "./announcements/ui/admin-announcements-client";
import AdminChoristerNoticesClient from "./choristers/ui/admin-chorister-notices-client";
import AdminChoristersClient from "./choristers/ui/admin-choristers-client";
import AdminPendingChoristersClient from "./choristers/ui/admin-pending-choristers-client";
import AdminRehearsalsClient from "./choristers/ui/admin-rehearsals-client";
import AdminEventsClient from "./events/ui/admin-events-client";
import AdminGalleryClient from "./gallery/ui/admin-gallery-client";
import AdminMusicClient from "./music/ui/admin-music-client";
import AdminAuditionsClient from "./ui/admin-auditions-client";
import AdminUsersClient from "./users/ui/admin-users-client";
import AdminVideosClient from "./videos/ui/admin-videos-client";

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCountLabel(value: number, noun: string) {
  return `${formatCompactNumber(value)} ${noun}`;
}

function AdminSection({
  id,
  index,
  title,
  eyebrow,
  description,
  countLabel,
  children,
}: {
  id: string;
  index: number;
  title: string;
  eyebrow: string;
  description: string;
  countLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="admin-section scroll-mt-24">
      <div className="flex flex-col gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="admin-eyebrow">
            {String(index).padStart(2, "0")} / {eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 admin-subtle sm:text-base">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="admin-pill">{countLabel}</span>
          <a href="#admin-top" className="admin-anchor">
            Back to top
          </a>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

export default async function AdminPage() {
  const [
    rows,
    events,
    posts,
    items,
    music,
    musicSheets,
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
    listMusicSheetsForAdmin(),
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

  const eventResponseMap = await getEventResponseRowsMap(events.map((event) => event.id));

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

  const pendingAuditions = rows.filter((row) => row.status === "PENDING").length;
  const publishedAnnouncements = posts.filter((post) => post.isPublished).length;
  const publishedEvents = events.filter((event) => event.isPublished).length;
  const publishedChoristerNotices = choristerNotices.filter((notice) => notice.isPublished).length;
  const mediaAssetCount = items.length + music.length + musicSheets.length + videos.length;
  const reviewQueueCount =
    pendingAuditions + pendingChoristers.length + pendingAttendance.length;

  const metrics = [
    {
      label: "Review queue",
      value: formatCompactNumber(reviewQueueCount),
      detail: `${pendingAuditions} auditions, ${pendingChoristers.length} chorister requests, ${pendingAttendance.length} attendance confirmations`,
    },
    {
      label: "Published updates",
      value: formatCompactNumber(
        publishedAnnouncements + publishedEvents + publishedChoristerNotices
      ),
      detail: `${publishedAnnouncements} announcements, ${publishedEvents} events, ${publishedChoristerNotices} chorister notices`,
    },
    {
      label: "Media library",
      value: formatCompactNumber(mediaAssetCount),
      detail: `${items.length} gallery items, ${music.length} tracks, ${musicSheets.length} sheet files, ${videos.length} videos`,
    },
    {
      label: "Community",
      value: formatCompactNumber(users.length),
      detail: `${choristers.length} verified choristers across ${rehearsals.length} rehearsals`,
    },
  ];

  const sections = [
    {
      id: "auditions",
      title: "Auditions",
      eyebrow: "Talent Pipeline",
      description: "Review incoming applicants, refine filters, and move strong candidates through the pipeline without losing context.",
      countLabel: formatCountLabel(rows.length, "applications"),
      content: <AdminAuditionsClient initialRows={rows} />,
    },
    {
      id: "events",
      title: "Events",
      eyebrow: "Programming",
      description: "Schedule rehearsals, performances, and public appearances with cleaner publishing control and sharper visibility.",
      countLabel: formatCountLabel(events.length, "events"),
      content: (
        <AdminEventsClient
          initialEvents={events.map((event) => ({
            ...event,
            responses: eventResponseMap.get(event.id) ?? [],
          }))}
        />
      ),
    },
    {
      id: "announcements",
      title: "Announcements",
      eyebrow: "Public Updates",
      description: "Draft, edit, and publish public-facing news in a workspace designed for quick editorial decisions.",
      countLabel: formatCountLabel(posts.length, "posts"),
      content: <AdminAnnouncementsClient initialPosts={posts} />,
    },
    {
      id: "gallery",
      title: "Gallery",
      eyebrow: "Visual Archive",
      description: "Upload and organize image content in a tighter grid that stays legible from phones to large desktop displays.",
      countLabel: formatCountLabel(items.length, "images"),
      content: <AdminGalleryClient initialItems={items} />,
    },
    {
      id: "music",
      title: "Music",
      eyebrow: "Audio Library",
      description: "Manage public audio tracks and restricted choir script sheet files from one workspace, including audience targeting for downloads.",
      countLabel: formatCountLabel(music.length + musicSheets.length, "assets"),
      content: (
        <AdminMusicClient
          initialItems={music}
          initialSheets={musicSheets.map((sheet) => ({
            id: sheet.id,
            title: sheet.title,
            fileName: sheet.fileName,
            mimeType: sheet.mimeType,
            publicId: sheet.publicId,
            audience: sheet.audience,
            createdAt: sheet.createdAt.toISOString(),
          }))}
        />
      ),
    },
    {
      id: "videos",
      title: "Videos",
      eyebrow: "Performance Library",
      description: "Handle performance footage and posters with enough spacing and hierarchy for fast edits across device sizes.",
      countLabel: formatCountLabel(videos.length, "videos"),
      content: <AdminVideosClient initialItems={videos} />,
    },
    {
      id: "chorister-notices",
      title: "Chorister Notices",
      eyebrow: "Member Updates",
      description: "Push notices to verified choristers with clearer attachment handling and better drafting visibility.",
      countLabel: formatCountLabel(choristerNotices.length, "notices"),
      content: (
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
      ),
    },
    {
      id: "rehearsals",
      title: "Rehearsals & Attendance",
      eyebrow: "Operations",
      description: "Create rehearsals and close the loop on attendance confirmations from a single responsive workspace.",
      countLabel: formatCountLabel(rehearsals.length, "rehearsals"),
      content: (
        <AdminRehearsalsClient
          initialRehearsals={rehearsalRows}
          initialPending={pendingAttendanceRows}
        />
      ),
    },
    {
      id: "pending-choristers",
      title: "Pending Choristers",
      eyebrow: "Verification",
      description: "Review chorister verification requests quickly and keep the approval queue visible without digging through user records.",
      countLabel: formatCountLabel(pendingChoristers.length, "pending"),
      content: (
        <AdminPendingChoristersClient
          initialUsers={pendingChoristers.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            createdAt: u.createdAt.toISOString(),
          }))}
        />
      ),
    },
    {
      id: "choristers",
      title: "Choristers",
      eyebrow: "Membership",
      description: "Inspect verified member profiles, notes, and attendance history in a cleaner, more polished review flow.",
      countLabel: formatCountLabel(choristers.length, "verified"),
      content: (
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
                    gender: u.choristerProfile.gender,
                    maritalStatus: u.choristerProfile.maritalStatus,
                    emergencyContact: u.choristerProfile.emergencyContact,
                    stateOfOrigin: u.choristerProfile.stateOfOrigin,
                    currentParish: u.choristerProfile.currentParish,
                    socialHandle: u.choristerProfile.socialHandle,
                    passportImageUrl: u.choristerProfile.passportImageUrl,
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
      ),
    },
    {
      id: "users",
      title: "Users",
      eyebrow: "Accounts",
      description: "Edit roles, chorister flags, and notes inside a calmer account management surface that scales down cleanly on mobile.",
      countLabel: formatCountLabel(users.length, "accounts"),
      content: <AdminUsersClient initialUsers={users} />,
    },
  ];

  return (
    <div id="admin-top" className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-8">
        <section className="admin-hero">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
            <div className="max-w-4xl">
              <p className="admin-eyebrow">Command Center</p>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl xl:text-6xl">
                Sleek control over the entire choir operation.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 admin-subtle sm:text-base">
                The dashboard is now organized as a high-clarity workspace: faster scanning,
                stronger visual hierarchy, and responsive navigation that holds together from
                small phones to wide desktop monitors.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <span className="admin-pill">11 active workspaces</span>
                <span className="admin-pill">
                  {formatCountLabel(reviewQueueCount, "items in queue")}
                </span>
                <span className="admin-pill">
                  {formatCountLabel(mediaAssetCount, "media assets")}
                </span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {metrics.map((metric) => (
                <div key={metric.label} className="admin-stat-card">
                  <p className="text-sm font-medium text-white/70">{metric.label}</p>
                  <p className="admin-metric-value">{metric.value}</p>
                  <p className="text-sm leading-6 admin-subtle">{metric.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-white/8 pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="admin-eyebrow">Jump To Workspace</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Fast navigation, no dead space
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 admin-subtle">
                Each module stays directly accessible from the overview, so mobile users
                don&apos;t need to scroll endlessly and desktop users retain full situational awareness.
              </p>
            </div>

            <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:overflow-visible sm:pb-0 2xl:grid-cols-3">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="admin-nav-card min-w-[18rem] snap-start sm:min-w-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="admin-eyebrow">{section.eyebrow}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {section.title}
                      </h3>
                    </div>
                    <span className="admin-pill shrink-0">{section.countLabel}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 admin-subtle">{section.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white">
                    Open module
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {sections.map((section, index) => (
          <AdminSection
            key={section.id}
            id={section.id}
            index={index + 1}
            title={section.title}
            eyebrow={section.eyebrow}
            description={section.description}
            countLabel={section.countLabel}
          >
            {section.content}
          </AdminSection>
        ))}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
        <div className="admin-side-card">
          <p className="admin-eyebrow">Overview</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Operational pulse</h2>
          <div className="mt-5 grid gap-3">
            <div className="admin-rail-stat">
              <span className="admin-subtle">Auditions awaiting review</span>
              <strong>{pendingAuditions}</strong>
            </div>
            <div className="admin-rail-stat">
              <span className="admin-subtle">Pending chorister approvals</span>
              <strong>{pendingChoristers.length}</strong>
            </div>
            <div className="admin-rail-stat">
              <span className="admin-subtle">Attendance confirmations</span>
              <strong>{pendingAttendance.length}</strong>
            </div>
            <div className="admin-rail-stat">
              <span className="admin-subtle">Verified choristers</span>
              <strong>{choristers.length}</strong>
            </div>
          </div>
        </div>

        <div className="admin-side-card">
          <p className="admin-eyebrow">Module Index</p>
          <nav className="mt-4 grid gap-2">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="admin-rail-link">
                <span>{section.title}</span>
                <span className="text-xs text-white/55">{section.countLabel}</span>
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
}
