export const heroAssetVersion = "20260606";

export function versionedHeroAsset(src: string) {
  return `${src}?v=${heroAssetVersion}`;
}
