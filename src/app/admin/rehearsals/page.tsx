import { materializeAutoAbsences } from "@/lib/attendance-auto";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import AdminRehearsalsClient from "../choristers/ui/admin-rehearsals-client";

export default async function AdminRehearsalsPage() {
  await materializeAutoAbsences(prisma);

  const [rehearsals, pendingAttendance] = await Promise.all([
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
    status: p.status,
    excuseNote: p.excuseNote,
    autoMarked: p.autoMarked,
    markedAt: p.markedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Operations"
        title="Rehearsals & Attendance"
        description="Create rehearsal dates, approve attendance, review excuses, and keep the automatic absence rule visible."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Rehearsals</p>
            <p className="admin-metric-value">{rehearsalRows.length}</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Pending</p>
            <p className="admin-metric-value">{pendingAttendanceRows.length}</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Confirmed</p>
            <p className="admin-metric-value">
              {rehearsalRows.reduce((total, row) => total + row.confirmedCount, 0)}
            </p>
          </div>
        </div>
      </AdminPageHeader>

      <AdminRehearsalsClient
        initialRehearsals={rehearsalRows}
        initialPending={pendingAttendanceRows}
      />
    </div>
  );
}
