import { materializeAutoAbsences } from "@/lib/attendance-auto";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import AdminChoristersClient from "./ui/admin-choristers-client";

export default async function AdminChoristersPage() {
  await materializeAutoAbsences(prisma);

  const choristers = await prisma.user.findMany({
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
  });

  const attendanceTotal = choristers.reduce(
    (total, chorister) => total + chorister.choristerAttendances.length,
    0
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Membership"
        title="Choristers"
        description="Review verified chorister profiles, passport records, private notes, and attendance history."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Verified</p>
            <p className="admin-metric-value">{choristers.length}</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Profiles</p>
            <p className="admin-metric-value">
              {choristers.filter((chorister) => chorister.choristerProfile).length}
            </p>
          </div>
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Attendance Rows</p>
            <p className="admin-metric-value">{attendanceTotal}</p>
          </div>
        </div>
      </AdminPageHeader>

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
            status: a.status,
            markedAt: a.markedAt.toISOString(),
            excuseNote: a.excuseNote,
            autoMarked: a.autoMarked,
            confirmedAt: a.confirmedAt ? a.confirmedAt.toISOString() : null,
          })),
        }))}
      />
    </div>
  );
}
