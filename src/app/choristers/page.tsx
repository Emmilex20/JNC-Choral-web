import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth";
import ChoristerClient from "./ui/chorister-client";

function canAccess(user: { role?: string; isChorister?: boolean; choristerVerified?: boolean } | null) {
  if (!user) return false;
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

  if (!canAccess(user)) redirect("/");

  const [profile, notices, rehearsals, attendance] = await Promise.all([
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
        emergencyContact: profile.emergencyContact,
        stateOfOrigin: profile.stateOfOrigin,
        currentParish: profile.currentParish,
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

  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
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
