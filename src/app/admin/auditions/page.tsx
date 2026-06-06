import {
  DEFAULT_AUDITION_ANTICIPATION_TEXT,
  getCurrentAuditionSetting,
} from "@/lib/audition-settings";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import AdminAuditionsClient from "../ui/admin-auditions-client";

export default async function AdminAuditionsPage() {
  const [rows, auditionSetting] = await Promise.all([
    prisma.auditionApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    getCurrentAuditionSetting(),
  ]);

  const pendingCount = rows.filter((row) => row.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Talent Pipeline"
        title="Auditions"
        description="Set the public audition schedule, export applications, and move applicants through the review process."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Applications</p>
            <p className="admin-metric-value">{rows.length}</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Pending</p>
            <p className="admin-metric-value">{pendingCount}</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Accepted</p>
            <p className="admin-metric-value">
              {rows.filter((row) => row.status === "ACCEPTED").length}
            </p>
          </div>
        </div>
      </AdminPageHeader>

      <AdminAuditionsClient
        initialRows={rows}
        initialSetting={{
          startsAt: auditionSetting?.startsAt
            ? auditionSetting.startsAt.toISOString()
            : "",
          venue: auditionSetting?.venue ?? "",
          note: auditionSetting?.note ?? "",
          anticipationText:
            auditionSetting?.anticipationText ?? DEFAULT_AUDITION_ANTICIPATION_TEXT,
        }}
      />
    </div>
  );
}
