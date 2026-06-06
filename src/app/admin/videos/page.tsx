import { prisma } from "@/lib/prisma";
import {
  getBestVideoPosterUrl,
  getOptimizedCloudinaryVideoUrl,
} from "@/lib/cloudinary-media";
import { AdminPageHeader } from "../_components/admin-page-header";
import AdminVideosClient from "./ui/admin-videos-client";

export default async function AdminVideosPage() {
  const items = await prisma.videoItem.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      title: true,
      videoUrl: true,
      posterUrl: true,
      publicId: true,
      createdAt: true,
    },
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

      <AdminVideosClient
        initialItems={items.map((item) => ({
          ...item,
          videoUrl: getOptimizedCloudinaryVideoUrl(item.videoUrl),
          posterUrl: getBestVideoPosterUrl(item.videoUrl, item.posterUrl),
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
