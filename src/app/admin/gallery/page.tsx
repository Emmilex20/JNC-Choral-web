import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import AdminGalleryClient from "./ui/admin-gallery-client";

export default async function AdminGalleryPage() {
  const items = await prisma.galleryItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Visual Archive"
        title="Gallery"
        description="Upload and manage image moments from rehearsals, concerts, backstage, and public appearances."
      >
        <div className="admin-stat-card min-h-0 max-w-xs">
          <p className="text-sm text-white/68">Images</p>
          <p className="admin-metric-value">{items.length}</p>
        </div>
      </AdminPageHeader>

      <AdminGalleryClient initialItems={items} />
    </div>
  );
}
