import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "./_components/admin-shell";

async function getPendingCounts(): Promise<Record<string, number>> {
  try {
    const [auditions, choristers, attendance, challenges] = await Promise.all([
      prisma.auditionApplication.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { isChorister: true, choristerVerified: false } }),
      prisma.attendanceRecord.count({ where: { confirmedAt: null } }),
      prisma.challengeSubmission.count({ where: { status: "PENDING" } }),
    ]);
    return {
      "/admin/auditions": auditions,
      "/admin/choristers/pending": choristers,
      "/admin/rehearsals": attendance,
      "/admin/challenges": challenges,
    };
  } catch {
    return {};
  }
}

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    redirect("/auth/login");
  }

  const badges = await getPendingCounts();

  return (
    <main id="main-content" tabIndex={-1} className="admin-shell relative min-h-screen overflow-x-clip bg-[#040712]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-14rem] top-24 h-[30rem] w-[30rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-16rem] top-32 h-[36rem] w-[36rem] rounded-full bg-amber-300/8 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
      <AdminShell userName={session.user.name} userEmail={session.user.email} badges={badges}>
        {children}
      </AdminShell>
    </main>
  );
}
