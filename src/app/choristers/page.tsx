import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { getMusicSheetAccess, listVisibleMusicSheets } from "@/lib/music-sheets";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth";
import ChoristerClient from "./ui/chorister-client";

function canAccess(user: { role?: string; isChorister?: boolean; choristerVerified?: boolean }) {
  if (user.role === "ADMIN") return true;
  return Boolean(user.isChorister && user.choristerVerified);
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

export default async function ChoristersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isChorister: true,
      choristerVerified: true,
      adminNote: true,
    },
  });

  if (!user || !canAccess(user)) redirect("/");

  const musicSheetAccess = await getMusicSheetAccess(session);

  const [profile, notices, rehearsals, attendance, sheets] = await Promise.all([
    prisma.choristerProfile.findUnique({
      where: { userId: user.id },
    }),
    prisma.choristerNotice.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.rehearsal.findMany({
      orderBy: { startsAt: "desc" },
      take: 200,
    }),
    prisma.attendanceRecord.findMany({
      where: { userId: user.id },
      include: {
        rehearsal: { select: { id: true, title: true, startsAt: true } },
      },
    }),
    listVisibleMusicSheets(musicSheetAccess),
  ]);

  const now = new Date();
  const completedRehearsals = rehearsals.filter((r) => r.startsAt <= now);
  const confirmedAttendance = attendance.filter((a) => a.confirmedAt);
  const totalRehearsals = completedRehearsals.length;
  const confirmedCount = confirmedAttendance.length;
  const attendancePercent =
    totalRehearsals === 0 ? 0 : Math.round((confirmedCount / totalRehearsals) * 100);

  const monthlyMap = new Map<string, { total: number; attended: number }>();
  completedRehearsals.forEach((r) => {
    const label = monthLabel(r.startsAt);
    const item = monthlyMap.get(label) ?? { total: 0, attended: 0 };
    item.total += 1;
    monthlyMap.set(label, item);
  });
  confirmedAttendance.forEach((a) => {
    const label = monthLabel(a.rehearsal.startsAt);
    const item = monthlyMap.get(label) ?? { total: 0, attended: 0 };
    item.attended += 1;
    monthlyMap.set(label, item);
  });

  const monthlyTrend = Array.from(monthlyMap.entries())
    .map(([label, values]) => ({
      label,
      total: values.total,
      attended: values.attended,
      percent: values.total === 0 ? 0 : Math.round((values.attended / values.total) * 100),
    }))
    .sort((a, b) => (a.label > b.label ? 1 : -1))
    .slice(-8);

  const serializedProfile = profile
    ? {
        id: profile.id,
        phone: profile.phone,
        address: profile.address,
        voicePart: profile.voicePart,
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : null,
        gender: profile.gender,
        maritalStatus: profile.maritalStatus,
        emergencyContact: profile.emergencyContact,
        stateOfOrigin: profile.stateOfOrigin,
        currentParish: profile.currentParish,
        socialHandle: profile.socialHandle,
        passportImageUrl: profile.passportImageUrl,
      }
    : null;

  const serializedNotices = notices.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    attachmentUrl: n.attachmentUrl,
    createdAt: n.createdAt.toISOString(),
  }));

  const serializedRehearsals = rehearsals.map((r) => ({
    id: r.id,
    title: r.title,
    startsAt: r.startsAt.toISOString(),
  }));

  const serializedAttendance = attendance.map((a) => ({
    id: a.id,
    rehearsalId: a.rehearsalId,
    status: a.status,
    confirmedAt: a.confirmedAt ? a.confirmedAt.toISOString() : null,
    rehearsal: {
      id: a.rehearsal.id,
      title: a.rehearsal.title,
      startsAt: a.rehearsal.startsAt.toISOString(),
    },
  }));

  const serializedSheets = sheets.map((sheet) => ({
    id: sheet.id,
    title: sheet.title,
    fileName: sheet.fileName,
    audience: sheet.audience,
    createdAt: sheet.createdAt.toISOString(),
    downloadUrl: `/api/music-sheets/${sheet.id}/download`,
  }));

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#02050d]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-24 h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-20 h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%)]" />
      </div>
      <SiteNavbar />
      <section className="relative mx-auto max-w-[90rem] px-4 py-10 md:px-6 xl:py-14">
        <ChoristerClient
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            adminNote: user.adminNote,
          }}
          profile={serializedProfile}
          notices={serializedNotices}
          rehearsals={serializedRehearsals}
          attendance={serializedAttendance}
          sheets={serializedSheets}
          stats={{
            totalRehearsals,
            confirmedCount,
            attendancePercent,
            monthlyTrend,
          }}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
