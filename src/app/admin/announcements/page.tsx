import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import AdminAnnouncementsClient from "./ui/admin-announcements-client";

export default async function AdminAnnouncementsPage() {
  const posts = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Public Updates"
        title="Announcements"
        description="Draft, edit, publish, and retire public-facing choir news from a focused editorial workspace."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Posts</p>
            <p className="admin-metric-value">{posts.length}</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Published</p>
            <p className="admin-metric-value">
              {posts.filter((post) => post.isPublished).length}
            </p>
          </div>
        </div>
      </AdminPageHeader>

      <AdminAnnouncementsClient initialPosts={posts} />
    </div>
  );
}
