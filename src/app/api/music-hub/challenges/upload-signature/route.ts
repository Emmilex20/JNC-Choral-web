import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { MEDIA_FORMATS, signUserUpload } from "@/lib/upload-signing";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const baseFolder = process.env.CLOUDINARY_FOLDER || "jnc-platform";

  return signUserUpload({
    userId: session.user.id,
    scope: "challenge",
    folder: `${baseFolder}/challenge-submissions/${session.user.id}`,
    allowedFormats: MEDIA_FORMATS,
    limitPerHour: 10,
  });
}
