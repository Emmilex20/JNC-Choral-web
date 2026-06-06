ALTER TABLE "MusicSheet"
ADD COLUMN "slug" TEXT,
ADD COLUMN "composer" TEXT NOT NULL DEFAULT 'Sir Jude Nnam',
ADD COLUMN "description" TEXT,
ADD COLUMN "voicing" TEXT,
ADD COLUMN "lyricsLanguage" TEXT,
ADD COLUMN "scoreKey" TEXT,
ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "MusicSheet"
SET "slug" = trim(
  both '-' from regexp_replace(
    lower(coalesce(nullif("title", ''), nullif("fileName", ''), "id")),
    '[^a-z0-9]+',
    '-',
    'g'
  )
) || '-' || substr("id", 1, 8)
WHERE "slug" IS NULL;

ALTER TABLE "MusicSheet" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "MusicSheet_slug_key" ON "MusicSheet"("slug");
