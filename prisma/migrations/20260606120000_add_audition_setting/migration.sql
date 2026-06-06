CREATE TABLE "AuditionSetting" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "startsAt" TIMESTAMP(3),
    "venue" TEXT,
    "note" TEXT,
    "anticipationText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditionSetting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AuditionSetting" (
    "id",
    "startsAt",
    "venue",
    "note",
    "anticipationText",
    "updatedAt"
)
VALUES (
    'current',
    '2026-02-01 15:30:00',
    'Catholic Secretariat, Durumi, Abuja',
    'Come with confidence - we are here to help you shine.',
    'Audition dates are being prepared. Keep rehearsing, stay ready, and watch this space for the next call.',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
