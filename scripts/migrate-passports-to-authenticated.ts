/**
 * One-off: make existing passport photos private (authenticated delivery).
 *   npx tsx scripts/migrate-passports-to-authenticated.ts          (dry run)
 *   npx tsx scripts/migrate-passports-to-authenticated.ts --apply
 * Reversible: rename back with to_type "upload" and restore the old URL.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

import { parseCloudinaryImageUrl } from "../src/lib/passport";

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
  const profiles = await prisma.choristerProfile.findMany({
    where: { passportImageUrl: { not: null } },
    select: { id: true, userId: true, passportImageUrl: true },
  });

  const todo = profiles.flatMap((profile) => {
    const parsed = profile.passportImageUrl ? parseCloudinaryImageUrl(profile.passportImageUrl) : null;
    return parsed && parsed.type === "upload" ? [{ profile, parsed }] : [];
  });
  console.log(`${profiles.length} passport images, ${todo.length} still public. ${apply ? "APPLYING" : "dry run"}`);

  for (const { profile, parsed } of todo) {
    console.log(`- user ${profile.userId} (${parsed.publicId})`);
    if (!apply) continue;
    try {
      const res = await cloudinary.uploader.rename(parsed.publicId, parsed.publicId, {
        resource_type: "image",
        type: "upload",
        to_type: "authenticated",
        invalidate: true,
      });
      await prisma.choristerProfile.update({
        where: { id: profile.id },
        data: { passportImageUrl: res.secure_url },
      });
      console.log("  moved to private delivery");
    } catch (error) {
      console.error("  FAILED", error);
    }
  }
}

main().finally(() => prisma.$disconnect());
