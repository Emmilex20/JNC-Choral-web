import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../../_components/admin-page-header";
import AdminPendingChoristersClient from "../ui/admin-pending-choristers-client";

export default async function AdminPendingChoristersPage() {
  const pendingChoristers = await prisma.user.findMany({
    where: { isChorister: true, choristerVerified: false },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Verification"
        title="Pending Choristers"
        description="Approve or decline chorister access requests without digging through the full user directory."
      >
        <div className="admin-stat-card min-h-0 max-w-xs">
          <p className="text-sm text-white/68">Awaiting Decision</p>
          <p className="admin-metric-value">{pendingChoristers.length}</p>
        </div>
      </AdminPageHeader>

      <AdminPendingChoristersClient
        initialUsers={pendingChoristers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
