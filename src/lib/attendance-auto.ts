import type { prisma as prismaClient } from "@/lib/prisma";
import {
  getAttendanceWindowState,
  getClosedRehearsalFetchCutoff,
} from "@/lib/attendance-policy";

type PrismaClientLike = typeof prismaClient;

type MaterializeOptions = {
  userId?: string;
  now?: Date;
};

export async function materializeAutoAbsences(
  db: PrismaClientLike,
  options: MaterializeOptions = {}
) {
  const now = options.now ?? new Date();
  const rehearsalCutoff = getClosedRehearsalFetchCutoff(now);

  const [rehearsals, choristers] = await Promise.all([
    db.rehearsal.findMany({
      where: { startsAt: { lt: rehearsalCutoff } },
      select: { id: true, startsAt: true },
    }),
    db.user.findMany({
      where: {
        isChorister: true,
        choristerVerified: true,
        ...(options.userId ? { id: options.userId } : {}),
      },
      select: { id: true },
    }),
  ]);

  const closedRehearsals = rehearsals.filter(
    (rehearsal) => getAttendanceWindowState(rehearsal.startsAt, now) === "CLOSED"
  );

  if (closedRehearsals.length === 0 || choristers.length === 0) return 0;

  const rehearsalIds = closedRehearsals.map((rehearsal) => rehearsal.id);
  const userIds = choristers.map((chorister) => chorister.id);

  const existingRecords = await db.attendanceRecord.findMany({
    where: {
      rehearsalId: { in: rehearsalIds },
      userId: { in: userIds },
    },
    select: { rehearsalId: true, userId: true },
  });

  const existingKeys = new Set(
    existingRecords.map((record) => `${record.rehearsalId}:${record.userId}`)
  );

  const data = closedRehearsals.flatMap((rehearsal) =>
    choristers
      .filter((chorister) => !existingKeys.has(`${rehearsal.id}:${chorister.id}`))
      .map((chorister) => ({
        rehearsalId: rehearsal.id,
        userId: chorister.id,
        status: "ABSENT" as const,
        excuseNote: null,
        autoMarked: true,
        markedAt: now,
        confirmedAt: now,
        confirmedBy: "system",
      }))
  );

  if (data.length === 0) return 0;

  const result = await db.attendanceRecord.createMany({
    data,
    skipDuplicates: true,
  });

  return result.count;
}
