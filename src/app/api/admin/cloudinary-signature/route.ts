import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import { cloudinary } from "@/lib/cloudinary";
import { isAdminSession } from "@/lib/authz";
import { getServerSession } from "next-auth";

const allowedFolderSuffixes = new Set([
  "academy",
  "event-media",
  "music-sheets",
  "spotlights",
]);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const baseFolder = process.env.CLOUDINARY_FOLDER || "jnc-platform";
  const url = new URL(request.url);
  const folderSuffix = url.searchParams.get("folderSuffix")?.trim();

  const folder =
    folderSuffix && allowedFolderSuffixes.has(folderSuffix)
      ? `${baseFolder}/${folderSuffix}`
      : baseFolder;

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    timestamp,
    signature,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}
