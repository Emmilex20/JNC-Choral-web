-- CreateEnum
CREATE TYPE "NotificationAudience" AS ENUM ('ADMIN', 'CHORISTERS', 'PUBLIC');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CHORISTER_NOTICE', 'ATTENDANCE_MARKED', 'REHEARSAL_CREATED', 'PUBLIC_ANNOUNCEMENT', 'PUBLIC_EVENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "audience" "NotificationAudience" NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRead" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_type_sourceId_audience_key" ON "Notification"("type", "sourceId", "audience");

-- CreateIndex
CREATE INDEX "Notification_audience_createdAt_idx" ON "Notification"("audience", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_sourceId_idx" ON "Notification"("type", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRead_notificationId_userId_key" ON "NotificationRead"("notificationId", "userId");

-- CreateIndex
CREATE INDEX "NotificationRead_userId_readAt_idx" ON "NotificationRead"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
