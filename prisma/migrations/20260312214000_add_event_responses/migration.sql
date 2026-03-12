CREATE TYPE "EventResponseStatus" AS ENUM ('ATTENDING', 'MAYBE', 'NOT_ATTENDING');

CREATE TABLE "EventResponse" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "status" "EventResponseStatus" NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EventResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventResponse_eventId_email_key" ON "EventResponse"("eventId", "email");
CREATE INDEX "EventResponse_eventId_idx" ON "EventResponse"("eventId");
CREATE INDEX "EventResponse_email_idx" ON "EventResponse"("email");

ALTER TABLE "EventResponse"
ADD CONSTRAINT "EventResponse_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
