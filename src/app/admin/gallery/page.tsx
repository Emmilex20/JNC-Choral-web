import { prisma } from "@/lib/prisma";
import AdminGalleryClient from "./ui/admin-gallery-client";

export default async function AdminGalleryPage() {
  const items = await prisma.galleryItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Gallery</h1>
        <p className="mt-2 text-sm text-white/70">
          Upload images to Cloudinary and publish them instantly on the public Gallery page.
        </p>
      </div>

      <AdminGalleryClient initialItems={items} />
    </div>
  );
}
