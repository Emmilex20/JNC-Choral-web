import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import AdminVideosClient from "./ui/admin-videos-client";

export default async function AdminVideosPage() {
  const items = await prisma.videoItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Performance Library"
        title="Videos"
        description="Upload, title, and poster performance videos for the public media section."
      >
        <div className="admin-stat-card min-h-0 max-w-xs">
          <p className="text-sm text-white/68">Videos</p>
          <p className="admin-metric-value">{items.length}</p>
        </div>
      </AdminPageHeader>

      <AdminVideosClient initialItems={items} />
    </div>
  );
}
