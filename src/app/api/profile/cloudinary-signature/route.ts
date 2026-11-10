import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { IMAGE_FORMATS, signUserUpload } from "@/lib/upload-signing";

const allowedFolderSuffixes = new Set(["passport-images"]);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseFolder = process.env.CLOUDINARY_FOLDER || "jnc-platform";
  const folderSuffix = new URL(request.url).searchParams.get("folderSuffix")?.trim();
  const folder =
    folderSuffix && allowedFolderSuffixes.has(folderSuffix)
      ? `${baseFolder}/${folderSuffix}`
      : `${baseFolder}/profile-images`;

  return signUserUpload({
    userId: session.user.id,
    scope: "profile",
    folder,
    allowedFormats: IMAGE_FORMATS,
  });
}
