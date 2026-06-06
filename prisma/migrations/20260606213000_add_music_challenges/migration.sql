-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT,
    "rules" TEXT,
    "coverImageUrl" TEXT,
    "coverImagePublicId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeSubmission" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'TEXT',
    "audioUrl" TEXT,
    "videoUrl" TEXT,
    "mediaPublicId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeVote" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug");

-- CreateIndex
CREATE INDEX "Challenge_isPublished_startsAt_endsAt_idx" ON "Challenge"("isPublished", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Challenge_type_idx" ON "Challenge"("type");

-- CreateIndex
CREATE INDEX "Challenge_createdAt_idx" ON "Challenge"("createdAt");

-- CreateIndex
CREATE INDEX "ChallengeSubmission_challengeId_status_idx" ON "ChallengeSubmission"("challengeId", "status");

-- CreateIndex
CREATE INDEX "ChallengeSubmission_userId_createdAt_idx" ON "ChallengeSubmission"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ChallengeSubmission_status_createdAt_idx" ON "ChallengeSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ChallengeSubmission_isWinner_idx" ON "ChallengeSubmission"("isWinner");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeVote_challengeId_userId_key" ON "ChallengeVote"("challengeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeVote_submissionId_userId_key" ON "ChallengeVote"("submissionId", "userId");

-- CreateIndex
CREATE INDEX "ChallengeVote_challengeId_createdAt_idx" ON "ChallengeVote"("challengeId", "createdAt");

-- CreateIndex
CREATE INDEX "ChallengeVote_submissionId_idx" ON "ChallengeVote"("submissionId");

-- CreateIndex
CREATE INDEX "ChallengeVote_userId_idx" ON "ChallengeVote"("userId");

-- AddForeignKey
ALTER TABLE "ChallengeSubmission" ADD CONSTRAINT "ChallengeSubmission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeSubmission" ADD CONSTRAINT "ChallengeSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeVote" ADD CONSTRAINT "ChallengeVote_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeVote" ADD CONSTRAINT "ChallengeVote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ChallengeSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeVote" ADD CONSTRAINT "ChallengeVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
