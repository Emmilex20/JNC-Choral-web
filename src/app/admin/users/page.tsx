import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import AdminUsersClient from "./ui/admin-users-client";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Accounts"
        title="Users"
        description="Manage account roles, chorister flags, verification status, and member-facing admin notes."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Accounts</p>
            <p className="admin-metric-value">{users.length}</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Admins</p>
            <p className="admin-metric-value">
              {users.filter((user) => user.role === "ADMIN").length}
            </p>
          </div>
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Choristers</p>
            <p className="admin-metric-value">
              {users.filter((user) => user.isChorister).length}
            </p>
          </div>
        </div>
      </AdminPageHeader>

      <AdminUsersClient initialUsers={users} />
    </div>
  );
}
