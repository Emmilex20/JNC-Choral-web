import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/auth";
import { cloudinary } from "@/lib/cloudinary";
import {
  findMusicSheetById,
  getMusicSheetAccess,
  getMusicSheetsMigrationErrorMessage,
} from "@/lib/music-sheets";

function toAttachmentName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
} 

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const access = await getMusicSheetAccess(session);

  if (!access.isSignedIn) {
    const url = new URL(request.url);
    const callbackUrl = `${url.pathname}${url.search}`;
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, url)
    );
  }

  const { sheet, missingTable } = await findMusicSheetById(id);

  if (missingTable) {
    return NextResponse.json(
      { error: getMusicSheetsMigrationErrorMessage() },
      { status: 503 }
    );
  }

  if (!sheet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!sheet.isPublished && !access.isAdmin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (sheet.audience === "CHORISTERS_ONLY" && !access.canAccessChoristerSheets) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Private uploads are type=authenticated: only reachable via a URL signed
  // with our API secret, which never leaves the server. Older sheets are public.
  const sourceUrl = sheet.fileUrl.includes("/authenticated/")
    ? cloudinary.url(sheet.publicId, {
        resource_type: "raw",
        type: "authenticated",
        sign_url: true,
        secure: true,
      })
    : sheet.fileUrl;

  const upstream = await fetch(sourceUrl);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": sheet.mimeType || upstream.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${toAttachmentName(sheet.fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
