import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { getPassportDeliveryUrl } from "@/lib/passport";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Passport photos are private: only the owner or an admin can view them. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const isAdmin = viewer?.role === "ADMIN";
  if (!isAdmin && session.user.id !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const profile = await prisma.choristerProfile.findUnique({
    where: { userId },
    select: { passportImageUrl: true },
  });
  const deliveryUrl = profile?.passportImageUrl
    ? getPassportDeliveryUrl(profile.passportImageUrl)
    : null;
  if (!deliveryUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const upstream = await fetch(deliveryUrl);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
