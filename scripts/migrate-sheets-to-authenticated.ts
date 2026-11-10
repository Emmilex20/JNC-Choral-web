/**
 * One-off: move existing music sheets from public to authenticated delivery.
 *   npx tsx scripts/migrate-sheets-to-authenticated.ts          (dry run)
 *   npx tsx scripts/migrate-sheets-to-authenticated.ts --apply
 * Reversible: rename back with to_type "upload" and restore fileUrl.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

const apply = process.argv.includes("--apply");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const sheets = await prisma.musicSheet.findMany({
    select: { id: true, title: true, audience: true, publicId: true, fileUrl: true },
  });
  const todo = sheets.filter((s) => !s.fileUrl.includes("/authenticated/"));
  console.log(`${sheets.length} sheets, ${todo.length} still public. ${apply ? "APPLYING" : "dry run"}`);

  for (const sheet of todo) {
    console.log(`- ${sheet.audience} ${sheet.title ?? sheet.id} (${sheet.publicId})`);
    if (!apply) continue;
    try {
      const res = await cloudinary.uploader.rename(sheet.publicId, sheet.publicId, {
        resource_type: "raw",
        type: "upload",
        to_type: "authenticated",
        invalidate: true,
      });
      await prisma.musicSheet.update({
        where: { id: sheet.id },
        data: { fileUrl: res.secure_url },
      });
      console.log(`  moved -> ${res.secure_url}`);
    } catch (error) {
      console.error("  FAILED", error);
    }
  }
}

main().finally(() => prisma.$disconnect());
