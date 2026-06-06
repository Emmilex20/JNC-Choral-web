export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "EXCUSED"] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export type AttendanceWindowState = "UPCOMING" | "OPEN" | "CLOSED";

const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ATTENDANCE_GRACE_DAYS = 5;

function startOfLagosDayUtc(date: Date) {
  const lagosTime = new Date(date.getTime() + LAGOS_OFFSET_MS);
  return new Date(
    Date.UTC(
      lagosTime.getUTCFullYear(),
      lagosTime.getUTCMonth(),
      lagosTime.getUTCDate()
    ) - LAGOS_OFFSET_MS
  );
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function getAttendanceWindow(startsAt: Date) {
  const opensAt = startOfLagosDayUtc(startsAt);
  const closesAt = addDays(opensAt, ATTENDANCE_GRACE_DAYS + 1);

  return { opensAt, closesAt };
}

export function getAttendanceWindowState(
  startsAt: Date,
  now = new Date()
): AttendanceWindowState {
  const { opensAt, closesAt } = getAttendanceWindow(startsAt);

  if (now < opensAt) return "UPCOMING";
  if (now >= closesAt) return "CLOSED";
  return "OPEN";
}

export function getClosedRehearsalFetchCutoff(now = new Date()) {
  return addDays(startOfLagosDayUtc(now), -ATTENDANCE_GRACE_DAYS);
}
