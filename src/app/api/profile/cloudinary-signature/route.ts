import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { cloudinary } from "@/lib/cloudinary";

const allowedFolderSuffixes = new Set(["passport-images"]);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
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
