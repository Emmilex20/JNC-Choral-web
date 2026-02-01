import { prisma } from "@/lib/prisma";
import AdminAnnouncementsClient from "./ui/admin-announcements-client";

export default async function AdminAnnouncementsPage() {
  const posts = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Announcements</h1>
        <p className="mt-2 text-sm text-white/70">
          Write updates and publish them to show on the public Announcements page.
        </p>
      </div>

      <AdminAnnouncementsClient initialPosts={posts} />
    </div>
  );
}
