ALTER TYPE "AttendanceStatus" ADD VALUE 'EXCUSED';

ALTER TABLE "AttendanceRecord"
ADD COLUMN "excuseNote" TEXT,
ADD COLUMN "autoMarked" BOOLEAN NOT NULL DEFAULT false;
