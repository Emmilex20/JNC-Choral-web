const VIDEO_UPLOAD_SEGMENT = "/video/upload/";
const IMAGE_UPLOAD_SEGMENT = "/image/upload/";

function insertTransformation(url: string, segment: string, transformation: string) {
  if (!url.includes(segment)) return url;
  return url.replace(segment, `${segment}${transformation}/`);
}

function replaceExtension(url: string, extension: string) {
  const queryIndex = url.indexOf("?");
  const base = queryIndex === -1 ? url : url.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : url.slice(queryIndex);
  const withExtension = /\.[a-z0-9]+$/i.test(base)
    ? base.replace(/\.[a-z0-9]+$/i, extension)
    : `${base}${extension}`;

  return `${withExtension}${query}`;
}

export function getOptimizedCloudinaryVideoUrl(videoUrl: string) {
  return insertTransformation(
    videoUrl,
    VIDEO_UPLOAD_SEGMENT,
    "f_auto,q_auto,w_1280,c_limit",
  );
}

export function getGeneratedCloudinaryVideoPosterUrl(videoUrl: string) {
  if (!videoUrl.includes(VIDEO_UPLOAD_SEGMENT)) return null;

  const posterUrl = insertTransformation(
    videoUrl,
    VIDEO_UPLOAD_SEGMENT,
    "so_1,w_1280,c_limit,q_auto,f_jpg",
  );

  return replaceExtension(posterUrl, ".jpg");
}

export function getOptimizedCloudinaryPosterUrl(posterUrl: string) {
  if (posterUrl.includes(IMAGE_UPLOAD_SEGMENT)) {
    return insertTransformation(
      posterUrl,
      IMAGE_UPLOAD_SEGMENT,
      "f_auto,q_auto,w_1280,c_limit",
    );
  }

  if (posterUrl.includes(VIDEO_UPLOAD_SEGMENT)) {
    return insertTransformation(
      posterUrl,
      VIDEO_UPLOAD_SEGMENT,
      "w_1280,c_limit,q_auto,f_jpg",
    );
  }

  return posterUrl;
}

export function getBestVideoPosterUrl(videoUrl: string, posterUrl: string | null) {
  if (posterUrl) return getOptimizedCloudinaryPosterUrl(posterUrl);
  return getGeneratedCloudinaryVideoPosterUrl(videoUrl);
}
