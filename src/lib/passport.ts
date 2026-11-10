import { cloudinary } from "@/lib/cloudinary";

export const PASSPORT_FOLDER = "passport-images";

// Sent to the browser instead of the stored URL, which is a non-expiring signed link.
export const PASSPORT_KEEP = "stored";

const CLOUDINARY_IMAGE_PATH =
  /\/image\/(upload|authenticated)\/(?:s--[^/]+--\/)?(?:v\d+\/)?(.+)$/;

/** Extracts delivery type, public id and format from a stored Cloudinary image URL. */
export function parseCloudinaryImageUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return null;
    const match = url.pathname.match(CLOUDINARY_IMAGE_PATH);
    if (!match) return null;

    const [, type, rest] = match;
    const decoded = decodeURIComponent(rest);
    const dot = decoded.lastIndexOf(".");
    const hasFormat = dot > decoded.lastIndexOf("/");
    return {
      type: type as "upload" | "authenticated",
      publicId: hasFormat ? decoded.slice(0, dot) : decoded,
      format: hasFormat ? decoded.slice(dot + 1) : undefined,
    };
  } catch {
    return null;
  }
}

/** A new passport upload must be a private file inside the owner's own folder. */
export function isOwnPrivatePassportUrl(value: string, userId: string) {
  const parsed = parseCloudinaryImageUrl(value);
  return Boolean(
    parsed &&
      parsed.type === "authenticated" &&
      parsed.publicId.includes(`/${PASSPORT_FOLDER}/${userId}/`)
  );
}

/** Server-side delivery URL: signed for private files, as-is for legacy public ones. */
export function getPassportDeliveryUrl(storedUrl: string) {
  const parsed = parseCloudinaryImageUrl(storedUrl);
  if (!parsed) return null;
  if (parsed.type === "upload") return storedUrl;

  return cloudinary.url(parsed.publicId, {
    resource_type: "image",
    type: "authenticated",
    sign_url: true,
    secure: true,
    format: parsed.format,
  });
}
