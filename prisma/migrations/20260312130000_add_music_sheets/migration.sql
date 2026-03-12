-- CreateEnum
CREATE TYPE "MusicSheetAudience" AS ENUM ('ALL_USERS', 'CHORISTERS_ONLY');

-- CreateTable
CREATE TABLE "MusicSheet" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "publicId" TEXT NOT NULL,
    "audience" "MusicSheetAudience" NOT NULL DEFAULT 'ALL_USERS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MusicSheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MusicSheet_publicId_key" ON "MusicSheet"("publicId");
