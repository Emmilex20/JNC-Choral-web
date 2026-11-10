import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { PASSPORT_FOLDER } from "@/lib/passport";
import { IMAGE_FORMATS, signUserUpload } from "@/lib/upload-signing";


export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseFolder = process.env.CLOUDINARY_FOLDER || "jnc-platform";
  const folderSuffix = new URL(request.url).searchParams.get("folderSuffix")?.trim();

  // Passport photos are private (authenticated delivery) in a per-user folder.
  if (folderSuffix === PASSPORT_FOLDER) {
    return signUserUpload({
      userId: session.user.id,
      scope: "passport",
      folder: `${baseFolder}/${PASSPORT_FOLDER}/${session.user.id}`,
      allowedFormats: IMAGE_FORMATS,
      type: "authenticated",
      limitPerHour: 10,
    });
  }

  return signUserUpload({
    userId: session.user.id,
    scope: "profile",
    folder: `${baseFolder}/profile-images`,
    allowedFormats: IMAGE_FORMATS,
  });
}
