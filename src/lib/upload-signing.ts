import { NextResponse } from "next/server";

import { cloudinary } from "@/lib/cloudinary";
import { consumeRateLimit } from "@/lib/rate-limit";

export const IMAGE_FORMATS = "jpg,jpeg,png,webp,heic";
export const MEDIA_FORMATS = "mp3,wav,m4a,aac,ogg,oga,webm,mp4,mov,m4v,flac";

type SignInput = {
  userId: string;
  scope: string;
  folder: string;
  allowedFormats: string;
  /** Set to authenticated for private files that need signed delivery URLs. */
  type?: "authenticated";
  limitPerHour?: number;
};

/**
 * Signs an upload for a non-admin user. `allowed_formats` is part of the signed
 * payload, so Cloudinary rejects any other file type even if the client is
 * tampered with. The client must send the same `allowed_formats` value.
 */
export async function signUserUpload({
  userId,
  scope,
  folder,
  allowedFormats,
  type,
  limitPerHour = 30,
}: SignInput) {
  if (!(await consumeRateLimit(`upload:${scope}:${userId}`, limitPerHour, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, allowed_formats: allowedFormats, ...(type ? { type } : {}) },
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    timestamp,
    signature,
    folder,
    allowedFormats,
    type,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}
