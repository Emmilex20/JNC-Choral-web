ALTER TABLE "DailyChallenge" ADD COLUMN "sightReadingExercise" JSONB;
ALTER TABLE "Challenge" ADD COLUMN "sightReadingExercise" JSONB;

CREATE TABLE "SightReadingAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "dailyChallengeId" TEXT,
  "challengeId" TEXT,
  "sourceType" TEXT NOT NULL,
  "exerciseTitle" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "pitchScore" INTEGER NOT NULL,
  "rhythmScore" INTEGER NOT NULL,
  "stabilityScore" INTEGER NOT NULL,
  "transpositionSemitones" DOUBLE PRECISION,
  "metrics" JSONB,
  "feedback" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SightReadingAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SightReadingAttempt_userId_createdAt_idx" ON "SightReadingAttempt"("userId", "createdAt");
CREATE INDEX "SightReadingAttempt_dailyChallengeId_createdAt_idx" ON "SightReadingAttempt"("dailyChallengeId", "createdAt");
CREATE INDEX "SightReadingAttempt_challengeId_createdAt_idx" ON "SightReadingAttempt"("challengeId", "createdAt");
CREATE INDEX "SightReadingAttempt_sourceType_score_idx" ON "SightReadingAttempt"("sourceType", "score");

ALTER TABLE "SightReadingAttempt" ADD CONSTRAINT "SightReadingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SightReadingAttempt" ADD CONSTRAINT "SightReadingAttempt_dailyChallengeId_fkey" FOREIGN KEY ("dailyChallengeId") REFERENCES "DailyChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SightReadingAttempt" ADD CONSTRAINT "SightReadingAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
