import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../../_components/admin-page-header";
import AdminChoristerNoticesClient from "../ui/admin-chorister-notices-client";

export default async function AdminChoristerNoticesPage() {
  const notices = await prisma.choristerNotice.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Member Updates"
        title="Chorister Notices"
        description="Publish private updates, instructions, and attachments for verified choristers."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Notices</p>
            <p className="admin-metric-value">{notices.length}</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Published</p>
            <p className="admin-metric-value">
              {notices.filter((notice) => notice.isPublished).length}
            </p>
          </div>
        </div>
      </AdminPageHeader>

      <AdminChoristerNoticesClient
        initialNotices={notices.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          attachmentUrl: n.attachmentUrl,
          isPublished: n.isPublished,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
