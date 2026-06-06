import { listMusicSheetsForAdmin } from "@/lib/music-sheets";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import AdminMusicClient from "./ui/admin-music-client";

export default async function AdminMusicPage() {
  const [music, musicSheets] = await Promise.all([
    prisma.musicItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    listMusicSheetsForAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Audio Library"
        title="Music"
        description="Manage public audio tracks and restricted choir sheet downloads from one focused workspace."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Tracks</p>
            <p className="admin-metric-value">{music.length}</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Sheet Files</p>
            <p className="admin-metric-value">{musicSheets.length}</p>
          </div>
        </div>
      </AdminPageHeader>

      <AdminMusicClient
        initialItems={music}
        initialSheets={musicSheets.map((sheet) => ({
          id: sheet.id,
          title: sheet.title,
          fileName: sheet.fileName,
          mimeType: sheet.mimeType,
          publicId: sheet.publicId,
          audience: sheet.audience,
          createdAt: sheet.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
